import { listJobs } from "@/lib/store";
import { statusLabel, categoryLabel } from "@/lib/format";
import {
  isAdminEmail,
  requireApiSession,
  unauthorized,
} from "@/lib/api-auth";

export async function GET() {
  const session = await requireApiSession();
  if (!session) return unauthorized();

  let jobs = await listJobs();
  if (!isAdminEmail(session.user.email)) {
    jobs = jobs.filter((job) => job.ownerId === session.user.id);
  }
  const header = [
    "id",
    "title",
    "status",
    "category",
    "priority",
    "amount",
    "currency",
    "clientName",
    "workerName",
    "workerEmail",
    "paypalOrderId",
    "paypalCaptureId",
    "aiApproved",
    "aiConfidence",
    "createdAt",
    "updatedAt",
  ];

  const rows = jobs.map((job) =>
    [
      job.id,
      csv(job.title),
      statusLabel(job.status),
      categoryLabel(job.category),
      job.priority,
      job.amount,
      job.currency,
      csv(job.clientName),
      csv(job.workerName),
      job.workerEmail,
      job.paypalOrderId || "",
      job.paypalCaptureId || "",
      job.aiVerdict ? String(job.aiVerdict.approved) : "",
      job.aiVerdict ? String(job.aiVerdict.confidence) : "",
      job.createdAt,
      job.updatedAt,
    ].join(","),
  );

  const body = [header.join(","), ...rows].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="paywhendone-jobs-${Date.now()}.csv"`,
    },
  });
}

function csv(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
