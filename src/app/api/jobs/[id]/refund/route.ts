import { NextResponse } from "next/server";
import { isPayPalMock, refundCapture } from "@/lib/paypal";
import { recordLedger, updateJob } from "@/lib/store";
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

  if (job.status !== "released" || !job.paypalCaptureId) {
    return NextResponse.json(
      { error: "Only captured/released jobs can be refunded." },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const note = String(body.note || "PayWhenDone refund after dispute");

  const refund = await refundCapture({
    captureId: job.paypalCaptureId,
    amount: job.amount,
    currency: job.currency,
    note,
  });

  await recordLedger({
    jobId: job.id,
    jobTitle: job.title,
    type: "refund",
    amount: job.amount,
    currency: job.currency,
    paypalId: refund.id,
    status: refund.status,
    mock: Boolean(refund.mock || isPayPalMock()),
  });

  const updated = await updateJob(
    job.id,
    {
      status: "refunded",
      paypalRefundId: refund.id,
      paypal: {
        ...job.paypal,
        refundId: refund.id,
        refundStatus: refund.status,
        syncedAt: new Date().toISOString(),
      },
    },
    {
      actor: "paypal",
      type: "refunded",
      message: `PayPal refund ${refund.id} issued`,
    },
  );

  return NextResponse.json({
    job: updated,
    refund,
    mock: Boolean(refund.mock || isPayPalMock()),
  });
}
