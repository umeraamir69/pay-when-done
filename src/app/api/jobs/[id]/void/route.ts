import { NextResponse } from "next/server";
import { shouldMockPayPalId, voidAuthorization } from "@/lib/paypal";
import { recordLedger, updateJob } from "@/lib/store";
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

  if (
    !["funded", "proof_submitted", "ai_rejected", "disputed"].includes(
      job.status,
    )
  ) {
    return NextResponse.json(
      { error: `Cannot void job in status ${job.status}.` },
      { status: 400 },
    );
  }

  if (!job.paypalAuthorizationId) {
    return NextResponse.json(
      { error: "Missing PayPal authorization id." },
      { status: 400 },
    );
  }

  const result = await voidAuthorization(job.paypalAuthorizationId);
  const usedMock =
    shouldMockPayPalId(job.paypalAuthorizationId) || Boolean(result.mock);

  await recordLedger({
    jobId: job.id,
    jobTitle: job.title,
    type: "void",
    amount: job.amount,
    currency: job.currency,
    paypalId: job.paypalAuthorizationId,
    status: "VOIDED",
    mock: usedMock,
  });

  const updated = await updateJob(
    job.id,
    {
      status: "voided",
      paypal: {
        ...job.paypal,
        authorizationStatus: "VOIDED",
        syncedAt: new Date().toISOString(),
      },
    },
    {
      actor: "paypal",
      type: "hold_voided",
      message: "PayPal authorization voided — client not charged",
    },
  );

  return NextResponse.json({
    job: updated,
    mock: usedMock,
  });
}
