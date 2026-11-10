import { NextResponse } from "next/server";
import { forbidden, unauthorized, isAdminEmail } from "./api-auth";
import type { Session } from "./auth";
import { getJob } from "./store";
import type { Job } from "./types";

/** Owner or allow-listed admin may manage the job. */
export function canManageJob(job: Job, session: Session) {
  if (job.ownerId === session.user.id) return true;
  return isAdminEmail(session.user.email);
}

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

  if (!canManageJob(job, session)) {
    return {
      job: null,
      error: forbidden("You do not have access to this job."),
    };
  }

  return { job, error: null };
}
