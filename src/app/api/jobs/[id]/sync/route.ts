import { NextResponse } from "next/server";
import { isPayPalMock, syncJobPayPalState } from "@/lib/paypal";
import { recordLedger, updateJob } from "@/lib/store";
import type { PayPalSnapshot } from "@/lib/types";
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

  const snapshot = (await syncJobPayPalState({
    orderId: job.paypalOrderId,
    authorizationId: job.paypalAuthorizationId,
    captureId: job.paypalCaptureId,
  })) as PayPalSnapshot & Record<string, unknown>;

  await recordLedger({
    jobId: job.id,
    jobTitle: job.title,
    type: "sync",
    amount: job.amount,
    currency: job.currency,
    paypalId: job.paypalOrderId || job.paypalAuthorizationId,
    status: String(
      snapshot.captureStatus ||
        snapshot.authorizationStatus ||
        snapshot.orderStatus ||
        "SYNCED",
    ),
    mock: isPayPalMock(),
    meta: snapshot,
  });

  const updated = await updateJob(
    job.id,
    {
      paypal: {
        ...job.paypal,
        orderId: (snapshot.orderId as string) || job.paypalOrderId,
        orderStatus: snapshot.orderStatus as string | undefined,
        authorizationId:
          (snapshot.authorizationId as string) || job.paypalAuthorizationId,
        authorizationStatus: snapshot.authorizationStatus as string | undefined,
        captureId: (snapshot.captureId as string) || job.paypalCaptureId,
        captureStatus: snapshot.captureStatus as string | undefined,
        syncedAt: new Date().toISOString(),
        raw: snapshot,
      },
    },
    {
      actor: "paypal",
      type: "paypal_synced",
      message: "Synced PayPal order / authorization / capture state",
    },
  );

  return NextResponse.json({
    job: updated,
    snapshot,
    mock: isPayPalMock(),
  });
}
