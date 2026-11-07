import { NextResponse } from "next/server";
import { requireApiSession, unauthorized } from "@/lib/api-auth";
import { requireOwnedJob } from "@/lib/job-access";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession();
  if (!session) return unauthorized();

  const { id } = await context.params;
  const access = await requireOwnedJob(id, session);
  if (access.error) return access.error;
  const job = access.job!;
  return NextResponse.json({ job });
}
