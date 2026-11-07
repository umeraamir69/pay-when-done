import { NextResponse } from "next/server";
import { upsertMilestones } from "@/lib/store";
import type { Milestone } from "@/lib/types";
import { randomUUID } from "crypto";
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

  const body = await request.json();
  const title = String(body.title || "").trim();
  const amount = Number(body.amount || 0);

  if (!title || amount <= 0) {
    return NextResponse.json(
      { error: "title and amount required." },
      { status: 400 },
    );
  }

  const milestone: Milestone = {
    id: randomUUID(),
    title,
    amount,
    status: "pending",
    dueAt: body.dueAt,
  };

  const updated = await upsertMilestones(id, [...job.milestones, milestone]);
  return NextResponse.json({ job: updated });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession();
  if (!session) return unauthorized();

  const { id } = await context.params;
  const access = await requireOwnedJob(id, session);
  if (access.error) return access.error;
  const job = access.job!;

  const body = await request.json();
  const milestoneId = body.milestoneId as string;
  const status = body.status as Milestone["status"];

  const milestones = job.milestones.map((m) =>
    m.id === milestoneId ? { ...m, status } : m,
  );
  const updated = await upsertMilestones(id, milestones);
  return NextResponse.json({ job: updated });
}
