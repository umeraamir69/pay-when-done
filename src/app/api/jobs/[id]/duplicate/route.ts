import { NextResponse } from "next/server";
import { requireApiSession, unauthorized } from "@/lib/api-auth";
import { createJob, getJob } from "@/lib/store";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession();
  if (!session) return unauthorized();

  const { id } = await context.params;
  const job = await getJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }
  if (job.ownerId && job.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const copy = await createJob(
    {
      title: `${job.title} (copy)`,
      brief: job.brief,
      amount: job.amount,
      currency: job.currency,
      category: job.category,
      priority: job.priority,
      tags: [...job.tags, "duplicate"],
      clientName: job.clientName,
      workerName: job.workerName,
      workerEmail: job.workerEmail,
      autoPayoutOnRelease: job.autoPayoutOnRelease,
      createInvoiceOnFund: job.createInvoiceOnFund,
    },
    session.user.id,
  );

  return NextResponse.json({ job: copy }, { status: 201 });
}
