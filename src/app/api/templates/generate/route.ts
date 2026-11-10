import { NextResponse } from "next/server";
import { generateJobTemplate } from "@/lib/ai";

export async function POST(request: Request) {
  let body: { prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (prompt.length < 8) {
    return NextResponse.json(
      { error: "Describe the job in a bit more detail (at least a sentence)." },
      { status: 400 },
    );
  }
  if (prompt.length > 2000) {
    return NextResponse.json(
      { error: "Keep the description under 2000 characters." },
      { status: 400 },
    );
  }

  try {
    const template = await generateJobTemplate(prompt);
    return NextResponse.json({ template });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not generate template.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
