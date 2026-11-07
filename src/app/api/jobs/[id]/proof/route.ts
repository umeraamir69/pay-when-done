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

  if (!["funded", "ai_rejected", "disputed"].includes(job.status)) {
    return NextResponse.json(
      {
        error:
          "Job must be funded (or previously rejected/disputed) before submitting proof.",
      },
      { status: 400 },
    );
  }

  const body = await request.json();
  const { proofNotes, proofImageDataUrl } = body ?? {};

  if (!proofNotes || !proofImageDataUrl) {
    return NextResponse.json(
      { error: "proofNotes and proofImageDataUrl are required." },
      { status: 400 },
    );
  }

  if (
    typeof proofImageDataUrl !== "string" ||
    !proofImageDataUrl.startsWith("data:image/")
  ) {
    return NextResponse.json(
      { error: "proofImageDataUrl must be a data:image/* URL." },
      { status: 400 },
    );
  }

  if (proofImageDataUrl.length > 3_500_000) {
    return NextResponse.json(
      { error: "Image too large. Use a smaller photo (< ~2.5MB)." },
      { status: 400 },
    );
  }

  const updated = await updateJob(
    job.id,
    {
      proofNotes: String(proofNotes).trim(),
      proofImageDataUrl,
      status: "proof_submitted",
      clearAiVerdict: true,
    },
    {
      actor: "worker",
      actorName: job.workerName,
      type: "proof_submitted",
      message: "Worker submitted proof photo and notes",
    },
  );

  return NextResponse.json({ job: updated });
}
