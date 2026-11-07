import { NextResponse } from "next/server";
import { createWorkerPayout, isPayPalMock } from "@/lib/paypal";
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

  if (job.status !== "released" && job.status !== "ai_approved") {
    return NextResponse.json(
      { error: "Payout requires an approved/released job." },
      { status: 400 },
    );
  }

  const payout = await createWorkerPayout({
    jobId: job.id,
    amount: job.amount,
    currency: job.currency,
    receiverEmail: job.workerEmail,
    note: `PayWhenDone payout — ${job.title}`,
  });

  const batchId =
    payout.batch_header?.payout_batch_id ||
    payout.batch_header?.payout_batch_id ||
    `PAYOUT-${job.id.slice(0, 8)}`;
  const itemId = payout.items?.[0]?.payout_item_id;
  const status =
    payout.batch_header?.batch_status ||
    payout.items?.[0]?.transaction_status ||
    "PENDING";

  await recordPayout({
    id: newId(),
    jobId: job.id,
    batchId,
    itemId,
    status,
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
    status,
    mock: Boolean(payout.mock || isPayPalMock()),
  });

  const updated = await updateJob(
    job.id,
    {
      paypalPayoutBatchId: batchId,
      paypal: {
        ...job.paypal,
        payoutBatchId: batchId,
        payoutItemId: itemId,
        payoutStatus: status,
        syncedAt: new Date().toISOString(),
      },
    },
    {
      actor: "paypal",
      type: "payout_sent",
      message: `Payout batch ${batchId} sent to ${job.workerEmail}`,
    },
  );

  return NextResponse.json({
    job: updated,
    payout,
    mock: Boolean(payout.mock || isPayPalMock()),
  });
}
