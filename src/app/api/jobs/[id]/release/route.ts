import { NextResponse } from "next/server";
import {
  captureAuthorization,
  createWorkerPayout,
  isPayPalMock,
} from "@/lib/paypal";
import {
  recordLedger,
  recordPayout,
  updateJob,
} from "@/lib/store";
import { newId } from "@/lib/db";
import { requireApiSession, unauthorized } from "@/lib/api-auth";
import { requireOwnedJob } from "@/lib/job-access";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession();
  if (!session) return unauthorized();

  const { id } = await context.params;
  const access = await requireOwnedJob(id, session);
  if (access.error) return access.error;
  const job = access.job!;

  if (job.status !== "ai_approved") {
    return NextResponse.json(
      { error: "AI must approve proof before releasing payment." },
      { status: 400 },
    );
  }

  if (!job.paypalAuthorizationId) {
    return NextResponse.json(
      { error: "Missing PayPal authorization id." },
      { status: 400 },
    );
  }

  const capture = await captureAuthorization(job.paypalAuthorizationId);

  await recordLedger({
    jobId: job.id,
    jobTitle: job.title,
    type: "capture",
    amount: job.amount,
    currency: job.currency,
    paypalId: capture.id,
    status: capture.status || "COMPLETED",
    mock: isPayPalMock() || Boolean(capture.mock),
  });

  let payoutBatchId: string | undefined = job.paypalPayoutBatchId;
  let payoutStatus: string | undefined;

  if (job.autoPayoutOnRelease) {
    try {
      const payout = await createWorkerPayout({
        jobId: job.id,
        amount: job.amount,
        currency: job.currency,
        receiverEmail: job.workerEmail,
        note: `PayWhenDone payout — ${job.title}`,
      });
      const batchId: string =
        payout.batch_header?.payout_batch_id || `PAYOUT-${job.id.slice(0, 8)}`;
      const batchStatus: string =
        payout.batch_header?.batch_status ||
        payout.items?.[0]?.transaction_status ||
        "PENDING";
      payoutBatchId = batchId;
      payoutStatus = batchStatus;

      await recordPayout({
        id: newId(),
        jobId: job.id,
        batchId,
        itemId: payout.items?.[0]?.payout_item_id,
        status: batchStatus,
        amount: job.amount,
        currency: job.currency,
        receiver: job.workerEmail,
        createdAt: new Date().toISOString(),
        mock: Boolean(payout.mock || isPayPalMock()),
        detail: payout,
      });

      await recordLedger({
        jobId: job.id,
        jobTitle: job.title,
        type: "payout",
        amount: job.amount,
        currency: job.currency,
        paypalId: batchId,
        status: batchStatus,
        mock: Boolean(payout.mock || isPayPalMock()),
      });
    } catch (error) {
      console.error("Auto payout failed:", error);
    }
  }

  const updated = await updateJob(
    job.id,
    {
      paypalCaptureId: capture.id,
      paypalPayoutBatchId: payoutBatchId,
      status: "released",
      paypal: {
        ...job.paypal,
        captureId: capture.id,
        captureStatus: capture.status || "COMPLETED",
        payoutBatchId,
        payoutStatus,
        syncedAt: new Date().toISOString(),
      },
    },
    {
      actor: "paypal",
      type: "payment_released",
      message: `PayPal capture ${capture.id}${
        payoutBatchId ? ` · payout ${payoutBatchId}` : ""
      }`,
    },
  );

  return NextResponse.json({
    job: updated,
    mock: isPayPalMock() || Boolean(capture.mock),
  });
}
