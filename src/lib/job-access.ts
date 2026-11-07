import { NextResponse } from "next/server";
import { forbidden, unauthorized, isAdminEmail } from "./api-auth";
import type { Session } from "./auth";
import { getJob } from "./store";
import type { Job } from "./types";

export async function requireOwnedJob(jobId: string, session: Session | null) {
  if (!session) {
    return { job: null as Job | null, error: unauthorized() };
  }

  const job = await getJob(jobId);
  if (!job) {
    return {
      job: null,
      error: NextResponse.json({ error: "Job not found." }, { status: 404 }),
    };
  }

  const owns = job.ownerId === session.user.id;
  const legacyAdmin =
    !job.ownerId && isAdminEmail(session.user.email);

  if (!owns && !legacyAdmin) {
    return { job: null, error: forbidden() };
  }

  return { job, error: null };
}
