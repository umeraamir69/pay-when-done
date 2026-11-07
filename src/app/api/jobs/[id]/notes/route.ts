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

  const body = await request.json();
  const internalNotes = String(body.internalNotes || "");

  const updated = await updateJob(
    id,
    { internalNotes },
    {
      actor: "admin",
      type: "internal_note",
      message: "Admin updated internal notes",
    },
  );

  return NextResponse.json({ job: updated });
}
