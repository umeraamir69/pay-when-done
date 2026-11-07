import { NextResponse } from "next/server";
import { createAuthorizationOrder, isPayPalMock } from "@/lib/paypal";
import { updateJob } from "@/lib/store";
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

  if (job.status !== "awaiting_payment" && job.status !== "draft") {
    return NextResponse.json(
      { error: `Cannot create order in status ${job.status}.` },
      { status: 400 },
    );
  }

  const order = await createAuthorizationOrder({
    amount: job.amount,
    currency: job.currency,
    jobId: job.id,
    description: `PayWhenDone escrow: ${job.title}`,
  });

  await updateJob(job.id, {
    paypalOrderId: order.id,
    status: "awaiting_payment",
  });

  return NextResponse.json({
    orderId: order.id,
    mock: isPayPalMock() || Boolean(order.mock),
  });
}
