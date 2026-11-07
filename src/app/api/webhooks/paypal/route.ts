import { NextResponse } from "next/server";
import { newId } from "@/lib/db";
import { verifyPayPalWebhook } from "@/lib/paypal";
import { listJobs, recordLedger, recordWebhook, updateJob } from "@/lib/store";

/**
 * PayPal webhook receiver — signature required in production.
 * Unauthenticated browsers / random POSTs are rejected.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const verified = await verifyPayPalWebhook(request, rawBody);
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.error },
      { status: verified.status },
    );
  }

  try {
    const payload = rawBody ? JSON.parse(rawBody) : {};
    const eventType = String(payload.event_type || payload.eventType || "UNKNOWN");
    const resource = payload.resource || {};
    const resourceId = String(
      resource.id ||
        resource.payout_batch_id ||
        resource.invoice_id ||
        resource.supplementary_data?.related_ids?.order_id ||
        "",
    );

    const jobs = await listJobs();
    const matched = jobs.find((job) =>
      [
        job.paypalOrderId,
        job.paypalAuthorizationId,
        job.paypalCaptureId,
        job.paypalInvoiceId,
        job.paypalPayoutBatchId,
        job.paypalRefundId,
      ].includes(resourceId),
    );

    await recordWebhook({
      id: newId(),
      receivedAt: new Date().toISOString(),
      eventType,
      resourceId: resourceId || undefined,
      jobId: matched?.id,
      payload,
      processed: Boolean(matched),
    });

    if (matched) {
      await recordLedger({
        jobId: matched.id,
        jobTitle: matched.title,
        type: "webhook",
        amount: matched.amount,
        currency: matched.currency,
        paypalId: resourceId,
        status: eventType,
        mock: false,
        meta: { eventType },
      });

      await updateJob(
        matched.id,
        {},
        {
          actor: "paypal",
          type: "webhook",
          message: `Webhook ${eventType} for ${resourceId || "resource"}`,
        },
      );
    }

    // Minimal ACK — do not leak internal job ids to the wire beyond necessity.
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("webhook_ingest_error", error);
    // Verified PayPal events: ACK so PayPal does not disable the webhook.
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
