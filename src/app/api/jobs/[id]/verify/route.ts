import { NextResponse } from "next/server";
import { verifyProofAgainstBrief } from "@/lib/ai";
import { updateJob } from "@/lib/store";
import { requireApiSession, unauthorized } from "@/lib/api-auth";
import { requireOwnedJob } from "@/lib/job-access";

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

  if (job.status !== "proof_submitted" && job.status !== "ai_rejected") {
    return NextResponse.json(
      { error: "Submit proof before running AI verification." },
      { status: 400 },
    );
  }

  if (!job.proofImageDataUrl || !job.proofNotes) {
    return NextResponse.json(
      { error: "Missing proof on this job." },
      { status: 400 },
    );
  }

  const verdict = await verifyProofAgainstBrief({
    title: job.title,
    brief: job.brief,
    proofNotes: job.proofNotes,
    proofImageDataUrl: job.proofImageDataUrl,
  });

  const updated = await updateJob(
    job.id,
    {
      aiVerdict: verdict,
      status: verdict.approved ? "ai_approved" : "ai_rejected",
    },
    {
      actor: "ai",
      type: verdict.approved ? "ai_approved" : "ai_rejected",
      message: `Muse ${verdict.approved ? "approved" : "rejected"} proof at ${Math.round(verdict.confidence * 100)}% confidence`,
    },
  );

  return NextResponse.json({ job: updated });
}
