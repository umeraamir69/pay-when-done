import { NextResponse } from "next/server";
import { createAndSendInvoice, isPayPalMock } from "@/lib/paypal";
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
  const recipientEmail =
    String(body.recipientEmail || "").trim() ||
    `${job.clientName.toLowerCase().replace(/\s+/g, ".")}@example.com`;

  const invoice = await createAndSendInvoice({
    jobId: job.id,
    title: job.title,
    amount: job.amount,
    currency: job.currency,
    clientName: job.clientName,
    recipientEmail,
    workerName: job.workerName,
  });

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

  const updated = await updateJob(
    job.id,
    {
      paypalInvoiceId: invoice.id,
      paypal: {
        ...job.paypal,
        invoiceId: invoice.id,
        invoiceStatus: invoice.status,
        syncedAt: new Date().toISOString(),
      },
    },
    {
      actor: "paypal",
      type: "invoice_sent",
      message: `PayPal invoice ${invoice.id} sent to ${recipientEmail}`,
    },
  );

  return NextResponse.json({
    job: updated,
    invoice,
    mock: Boolean(invoice.mock || isPayPalMock()),
  });
}
