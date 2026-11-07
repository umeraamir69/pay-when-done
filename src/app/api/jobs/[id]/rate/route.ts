import { NextResponse } from "next/server";
import { updateJob } from "@/lib/store";
import { requireApiSession, unauthorized } from "@/lib/api-auth";
import { requireOwnedJob } from "@/lib/job-access";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession();
  if (!session) return unauthorized();

  const { id } = await context.params;
  const access = await requireOwnedJob(id, session);
  if (access.error) return access.error;
  const job = access.job!;

  if (job.status !== "released") {
    return NextResponse.json(
      { error: "Only released jobs can be rated." },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const rating = Number(body.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "rating must be 1–5." },
      { status: 400 },
    );
  }

  const updated = await updateJob(
    id,
    { workerRating: Math.round(rating) },
    {
      actor: "client",
      actorName: job.clientName,
      type: "worker_rated",
      message: `Client rated worker ${Math.round(rating)}/5`,
    },
  );

  return NextResponse.json({ job: updated });
}
