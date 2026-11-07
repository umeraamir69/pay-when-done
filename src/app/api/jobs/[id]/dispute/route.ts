import { NextResponse } from "next/server";
import { appendDispute } from "@/lib/store";
import type { ActorRole } from "@/lib/types";
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
  const author = (body.author || "client") as ActorRole;
  const authorName = String(body.authorName || author);
  const message = String(body.body || "").trim();

  if (!message) {
    return NextResponse.json({ error: "Message required." }, { status: 400 });
  }

  const updated = await appendDispute(id, {
    author,
    authorName,
    body: message,
  });

  return NextResponse.json({ job: updated });
}
