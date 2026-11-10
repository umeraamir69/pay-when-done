import { NextResponse } from "next/server";
import { requireApiSession, unauthorized } from "@/lib/api-auth";
import { requireOwnedJob } from "@/lib/job-access";
import { createJob } from "@/lib/store";

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
