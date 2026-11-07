import { NextResponse } from "next/server";
import { requireApiSession, unauthorized } from "@/lib/api-auth";
import { createJob, listJobs } from "@/lib/store";
import type { JobCategory, JobPriority } from "@/lib/types";

export async function GET(request: Request) {
  const session = await requireApiSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = (searchParams.get("q") || "").toLowerCase().trim();
  const category = searchParams.get("category");

  let jobs = await listJobs();
  // Scope to the signed-in owner's jobs (legacy rows without ownerId stay hidden).
  jobs = jobs.filter((job) => job.ownerId === session.user.id);
  if (status) jobs = jobs.filter((job) => job.status === status);
  if (category) jobs = jobs.filter((job) => job.category === category);
  if (q) {
    jobs = jobs.filter((job) =>
      [job.title, job.clientName, job.workerName, job.workerEmail, ...job.tags]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }

  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (!session) return unauthorized();

  const body = await request.json();
  const {
    title,
    brief,
    amount,
    clientName,
    workerName,
    workerEmail,
    currency,
    category,
    priority,
    tags,
    dueAt,
    autoPayoutOnRelease,
    createInvoiceOnFund,
  } = body ?? {};

  if (
    !title ||
    !brief ||
    !amount ||
    !clientName ||
    !workerName ||
    !workerEmail
  ) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 },
    );
  }

  if (Number(amount) <= 0) {
    return NextResponse.json(
      { error: "Amount must be greater than 0." },
      { status: 400 },
    );
  }

  const job = await createJob(
    {
      title,
      brief,
      amount: Number(amount),
      currency,
      category: category as JobCategory | undefined,
      priority: priority as JobPriority | undefined,
      tags: Array.isArray(tags) ? tags : undefined,
      clientName,
      workerName,
      workerEmail,
      dueAt,
      autoPayoutOnRelease:
        autoPayoutOnRelease === undefined ? true : Boolean(autoPayoutOnRelease),
      createInvoiceOnFund: Boolean(createInvoiceOnFund),
    },
    session.user.id,
  );

  return NextResponse.json({ job }, { status: 201 });
}
