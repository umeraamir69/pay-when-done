import { NextResponse } from "next/server";
import { listJobs } from "@/lib/store";
import { requireApiSession, unauthorized } from "@/lib/api-auth";

export async function GET() {
  const session = await requireApiSession();
  if (!session) return unauthorized();
  void session;

  const jobs = await listJobs();
  const notifications = jobs
    .flatMap((job) =>
      job.activity.map((event) => ({
        id: `${job.id}-${event.id}`,
        jobId: job.id,
        jobTitle: job.title,
        at: event.at,
        actor: event.actor,
        type: event.type,
        message: event.message,
        status: job.status,
        unreadHint: [
          "ai_approved",
          "ai_rejected",
          "dispute_message",
          "payment_released",
          "funds_held",
        ].includes(event.type),
      })),
    )
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 40);

  return NextResponse.json({
    notifications,
    counts: {
      total: notifications.length,
      actionable: notifications.filter((n) => n.unreadHint).length,
    },
  });
}
