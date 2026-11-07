import { NextResponse } from "next/server";
import {
  authorizeOrder,
  createAndSendInvoice,
  extractAuthorizationId,
  isPayPalMock,
} from "@/lib/paypal";
import {
  recordInvoice,
  recordLedger,
  updateJob,
} from "@/lib/store";
import { newId } from "@/lib/db";
import { requireApiSession, unauthorized } from "@/lib/api-auth";
import { requireOwnedJob } from "@/lib/job-access";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession();
  if (!session) return unauthorized();

  const { id } = await context.params;
  const access = await requireOwnedJob(id, session);
  if (access.error) return access.error;
  const job = access.job!;

  const body = await request.json().catch(() => ({}));
  const orderId = body.orderId || job.paypalOrderId;
  if (!orderId) {
    return NextResponse.json(
      { error: "Missing PayPal order id." },
      { status: 400 },
    );
  }

  const result = await authorizeOrder(orderId);
  const authorizationId = extractAuthorizationId(result);

  if (!authorizationId) {
    return NextResponse.json(
      { error: "Authorization id missing from PayPal response." },
      { status: 502 },
    );
  }

  await recordLedger({
    jobId: job.id,
    jobTitle: job.title,
    type: "authorize",
    amount: job.amount,
    currency: job.currency,
    paypalId: authorizationId,
    status: "CREATED",
    mock: isPayPalMock() || Boolean(result.mock),
  });

  let invoiceId = job.paypalInvoiceId;
  if (job.createInvoiceOnFund) {
    try {
      const recipientEmail = `${job.clientName
        .toLowerCase()
        .replace(/\s+/g, ".")}@example.com`;
      const invoice = await createAndSendInvoice({
        jobId: job.id,
        title: job.title,
        amount: job.amount,
        currency: job.currency,
        clientName: job.clientName,
        recipientEmail,
        workerName: job.workerName,
      });
      invoiceId = invoice.id;
      await recordInvoice({
        id: newId(),
        jobId: job.id,
        paypalInvoiceId: invoice.id,
        status: invoice.status,
        amount: job.amount,
        currency: job.currency,
        recipientEmail,
        createdAt: new Date().toISOString(),
        mock: Boolean(invoice.mock || isPayPalMock()),
        detail: invoice,
      });
      await recordLedger({
        jobId: job.id,
        jobTitle: job.title,
        type: "invoice",
        amount: job.amount,
        currency: job.currency,
        paypalId: invoice.id,
        status: invoice.status,
        mock: Boolean(invoice.mock || isPayPalMock()),
      });
    } catch (error) {
      console.error("Invoice on fund failed:", error);
    }
  }

  const updated = await updateJob(
    job.id,
    {
      paypalOrderId: orderId,
      paypalAuthorizationId: authorizationId,
      paypalInvoiceId: invoiceId,
      status: "funded",
      paypal: {
        ...job.paypal,
        orderId,
        authorizationId,
        authorizationStatus: "CREATED",
        invoiceId,
        syncedAt: new Date().toISOString(),
      },
    },
    {
      actor: "paypal",
      actorName: job.clientName,
      type: "funds_held",
      message: `PayPal authorization held $${job.amount.toFixed(2)}${
        invoiceId ? ` · invoice ${invoiceId}` : ""
      }`,
    },
  );

  return NextResponse.json({
    job: updated,
    mock: isPayPalMock() || Boolean(result.mock),
  });
}
