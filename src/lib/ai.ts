import type { AiVerdict } from "./types";

/**
 * Verifies uploaded proof against the job brief using Meta Muse (Model API).
 * OpenAI-compatible endpoint: https://api.meta.ai/v1
 * Falls back to a deterministic mock when no key is set.
 */
const MUSE_BASE_URL =
  process.env.MUSE_BASE_URL || "https://api.meta.ai/v1";
const MUSE_MODEL = process.env.MUSE_MODEL || "muse-spark-1.3";

function getMuseApiKey() {
  return (
    process.env.MODEL_API_KEY ||
    process.env.MUSE_API_KEY ||
    process.env.OPENAI_API_KEY || // allow reuse if someone already pasted a Muse key here
    ""
  );
}

export async function verifyProofAgainstBrief(params: {
  brief: string;
  title: string;
  proofNotes?: string;
  proofImageDataUrl?: string;
}): Promise<AiVerdict> {
  const apiKey = getMuseApiKey();
  if (apiKey) {
    try {
      return await verifyWithMuse(params, apiKey);
    } catch (error) {
      console.error("Muse verify failed, falling back to mock:", error);
      return mockVerify(params, "muse-fallback");
    }
  }
  return mockVerify(params, "mock");
}

async function verifyWithMuse(
  params: {
    brief: string;
    title: string;
    proofNotes?: string;
    proofImageDataUrl?: string;
  },
  apiKey: string,
): Promise<AiVerdict> {
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [
    {
      type: "text",
      text: `You are an escrow verification agent for PayWhenDone.
Compare the worker's proof to the job brief. Be strict but fair.
Return ONLY valid JSON with this shape:
{
  "approved": boolean,
  "confidence": number between 0 and 1,
  "summary": string,
  "matchedRequirements": string[],
  "missingRequirements": string[]
}

Job title: ${params.title}
Job brief:
${params.brief}

Worker notes:
${params.proofNotes || "(none)"}
`,
    },
  ];

  if (params.proofImageDataUrl) {
    content.push({
      type: "image_url",
      image_url: { url: params.proofImageDataUrl },
    });
  }

  const res = await fetch(`${MUSE_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MUSE_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You verify completed gig work for payment release. Output JSON only.",
        },
        { role: "user", content },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Muse error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw) as {
    approved?: boolean;
    confidence?: number;
    summary?: string;
    matchedRequirements?: string[];
    missingRequirements?: string[];
  };

  return {
    approved: Boolean(parsed.approved),
    confidence: clamp(Number(parsed.confidence ?? 0.5), 0, 1),
    summary: parsed.summary || "No summary provided.",
    matchedRequirements: parsed.matchedRequirements || [],
    missingRequirements: parsed.missingRequirements || [],
    checkedAt: new Date().toISOString(),
    provider: "muse",
  };
}

function mockVerify(
  params: {
    brief: string;
    title: string;
    proofNotes?: string;
    proofImageDataUrl?: string;
  },
  reason: string,
): AiVerdict {
  const notes = (params.proofNotes || "").toLowerCase();
  const brief = params.brief.toLowerCase();
  const hasImage = Boolean(params.proofImageDataUrl);
  const keywords = extractKeywords(brief);
  const matched = keywords.filter((k) => notes.includes(k) || hasImage);
  const missing = keywords.filter((k) => !matched.includes(k));

  const coverage = keywords.length
    ? matched.length / keywords.length
    : hasImage
      ? 0.8
      : 0.2;
  const approved =
    hasImage &&
    notes.length >= 12 &&
    (coverage >= 0.4 || notes.split(/\s+/).length >= 8);

  return {
    approved,
    confidence: approved ? 0.72 + coverage * 0.2 : 0.35 + coverage * 0.2,
    summary: approved
      ? `Mock AI (${reason}): Proof looks consistent with the brief. Ready to release payment.`
      : `Mock AI (${reason}): Proof does not clearly cover the brief. Hold payment and ask for better evidence.`,
    matchedRequirements: matched.length
      ? matched
      : approved
        ? ["visual proof present", "worker notes provided"]
        : [],
    missingRequirements: approved
      ? []
      : missing.length
        ? missing
        : ["clear photo evidence", "notes that map to the brief"],
    checkedAt: new Date().toISOString(),
    provider: "mock",
  };
}

function extractKeywords(brief: string): string[] {
  const stop = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "into",
    "your",
    "have",
    "will",
    "please",
    "need",
    "must",
    "should",
    "a",
    "an",
    "to",
    "of",
    "in",
    "on",
    "at",
    "by",
    "or",
    "is",
    "are",
    "be",
  ]);
  return Array.from(
    new Set(
      brief
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !stop.has(w)),
    ),
  ).slice(0, 8);
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
