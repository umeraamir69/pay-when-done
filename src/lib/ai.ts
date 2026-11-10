import type { AiVerdict, JobCategory, JobPriority } from "./types";
import type { GeneratedTemplate } from "./templates";

/**
 * Verifies uploaded proof against the job brief using Meta Muse (Model API).
 * OpenAI-compatible endpoint: https://api.meta.ai/v1
 * Falls back to a deterministic mock when no key is set.
 */
const MUSE_BASE_URL =
  process.env.MUSE_BASE_URL || "https://api.meta.ai/v1";
const MUSE_MODEL = process.env.MUSE_MODEL || "muse-spark-1.3";

const CATEGORIES: JobCategory[] = [
  "cleaning",
  "moving",
  "tutoring",
  "handyman",
  "creative",
  "other",
];
const PRIORITIES: JobPriority[] = ["low", "normal", "high"];

export type { GeneratedTemplate };

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

/**
 * Turn a plain-language gig description into a structured job template.
 * Uses Muse when a key is present; otherwise a solid heuristic builder.
 */
export async function generateJobTemplate(
  prompt: string,
): Promise<GeneratedTemplate> {
  const cleaned = prompt.trim().replace(/\s+/g, " ");
  if (cleaned.length < 8) {
    throw new Error("Describe the job in a bit more detail.");
  }

  const apiKey = getMuseApiKey();
  if (apiKey) {
    try {
      return await generateWithMuse(cleaned, apiKey);
    } catch (error) {
      console.error("Muse template generate failed, falling back:", error);
      return heuristicTemplate(cleaned, "muse-fallback");
    }
  }
  return heuristicTemplate(cleaned, "mock");
}

async function generateWithMuse(
  prompt: string,
  apiKey: string,
): Promise<GeneratedTemplate> {
  const res = await fetch(`${MUSE_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MUSE_MODEL,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You write escrow job templates for PayWhenDone. Output JSON only. Briefs must include clear acceptance criteria and photo proof requirements.",
        },
        {
          role: "user",
          content: `Create one job template from this gig description.

Return ONLY valid JSON:
{
  "label": string (short chip label, ≤24 chars),
  "title": string (specific job title),
  "brief": string (2–4 sentences: scope + what “done” means + required proof photos/notes),
  "amount": number (USD suggested escrow, realistic for the work),
  "category": one of ${CATEGORIES.join(", ")},
  "priority": one of ${PRIORITIES.join(", ")},
  "tags": string[] (2–5 short kebab-case tags),
  "audience": string (who typically hires this)
}

Gig description:
${prompt}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Muse error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw) as Partial<GeneratedTemplate>;
  return normalizeGenerated(parsed, prompt, "muse");
}

function heuristicTemplate(
  prompt: string,
  reason: "mock" | "muse-fallback",
): GeneratedTemplate {
  const lower = prompt.toLowerCase();
  const category = detectCategory(lower);
  const priority = detectPriority(lower);
  const amount = suggestAmount(category, lower);
  const title = titleFromPrompt(prompt, category);
  const label = labelFromTitle(title);
  const tags = tagsFor(category, lower);
  const brief = briefFromPrompt(prompt, category);

  return {
    id: `ai-${Date.now().toString(36)}`,
    label,
    title,
    brief,
    amount,
    category,
    priority,
    tags,
    audience: audienceFor(category),
    provider: "mock",
  };
}

function normalizeGenerated(
  parsed: Partial<GeneratedTemplate>,
  prompt: string,
  provider: "muse" | "mock",
): GeneratedTemplate {
  const category = CATEGORIES.includes(parsed.category as JobCategory)
    ? (parsed.category as JobCategory)
    : detectCategory(prompt.toLowerCase());
  const priority = PRIORITIES.includes(parsed.priority as JobPriority)
    ? (parsed.priority as JobPriority)
    : "normal";
  const amount = Number(parsed.amount);
  const title =
    (parsed.title || "").trim() || titleFromPrompt(prompt, category);
  const label =
    (parsed.label || "").trim() || labelFromTitle(title);
  const brief =
    (parsed.brief || "").trim() || briefFromPrompt(prompt, category);
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags
        .map((t) => String(t).trim().toLowerCase().replace(/\s+/g, "-"))
        .filter(Boolean)
        .slice(0, 5)
    : tagsFor(category, prompt.toLowerCase());

  return {
    id: `ai-${Date.now().toString(36)}`,
    label: label.slice(0, 32),
    title: title.slice(0, 120),
    brief,
    amount:
      Number.isFinite(amount) && amount > 0
        ? Math.round(amount)
        : suggestAmount(category, prompt.toLowerCase()),
    category,
    priority,
    tags: tags.length ? tags : tagsFor(category, prompt.toLowerCase()),
    audience:
      (parsed.audience || "").trim() || audienceFor(category),
    provider,
  };
}

function detectCategory(lower: string): JobCategory {
  const rules: Array<[JobCategory, string[]]> = [
    ["cleaning", ["clean", "tidy", "scrub", "mop", "vacuum", "bathroom", "kitchen", "janitor"]],
    ["moving", ["move", "moving", "haul", "truck", "unpack", "pack", "furniture", "boxes"]],
    ["tutoring", ["tutor", "tutoring", "lesson", "teach", "coaching", "sat", "homework", "spanish", "math", "python"]],
    ["handyman", ["handyman", "repair", "fix", "mount", "install", "faucet", "shelf", "deck", "plumbing"]],
    ["creative", ["photo", "logo", "design", "edit", "reel", "copy", "brand", "video", "shoot"]],
  ];
  for (const [cat, words] of rules) {
    if (words.some((w) => lower.includes(w))) return cat;
  }
  return "other";
}

function detectPriority(lower: string): JobPriority {
  if (/\b(urgent|asap|same[- ]?day|today|emergency)\b/.test(lower)) {
    return "high";
  }
  if (/\b(whenever|flexible|low priority|no rush)\b/.test(lower)) {
    return "low";
  }
  return "normal";
}

function suggestAmount(category: JobCategory, lower: string): number {
  const base: Record<JobCategory, number> = {
    cleaning: 90,
    moving: 130,
    tutoring: 60,
    handyman: 150,
    creative: 180,
    other: 75,
  };
  let amount = base[category];
  if (/\b(deep|full|move[- ]?out|2br|3br|all[- ]day)\b/.test(lower)) {
    amount = Math.round(amount * 1.6);
  }
  if (/\b(quick|hour|60[- ]?min|light)\b/.test(lower)) {
    amount = Math.round(amount * 0.7);
  }
  const money = lower.match(/\$\s?(\d{2,4})/);
  if (money) return Number(money[1]);
  return amount;
}

function titleFromPrompt(prompt: string, category: JobCategory): string {
  const trimmed = prompt.trim().replace(/[.!?]+$/, "");
  if (trimmed.length <= 72) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  const first = trimmed.split(/[.!?]/)[0]?.trim() || trimmed;
  if (first.length <= 72) {
    return first.charAt(0).toUpperCase() + first.slice(1);
  }
  const defaults: Record<JobCategory, string> = {
    cleaning: "Custom cleaning job",
    moving: "Custom moving help",
    tutoring: "Custom tutoring session",
    handyman: "Custom handyman job",
    creative: "Custom creative deliverable",
    other: "Custom gig",
  };
  return defaults[category];
}

function labelFromTitle(title: string): string {
  const words = title.split(/\s+/).slice(0, 3).join(" ");
  return words.length > 24 ? `${words.slice(0, 21)}…` : words;
}

function briefFromPrompt(prompt: string, category: JobCategory): string {
  const scope = prompt.trim().replace(/\s+/g, " ").replace(/[.!?]?$/, ".");
  const proofHints: Record<JobCategory, string> = {
    cleaning:
      "After photos of each cleaned area required before payment release.",
    moving:
      "Photos of emptied origin and set-up destination required as proof.",
    tutoring:
      "Share a short summary of topics covered plus a session end screenshot.",
    handyman:
      "Safety/finish photos of the repaired area required before payout.",
    creative:
      "Deliver final files in a shared folder; include a contact sheet or export link as proof.",
    other:
      "Upload clear completion photos and notes that map to this brief.",
  };
  const done =
    "Done means the scope above is complete, spaces/tools left tidy, and proof matches these criteria.";
  return `${scope} ${done} ${proofHints[category]}`;
}

function tagsFor(category: JobCategory, lower: string): string[] {
  const base: Record<JobCategory, string[]> = {
    cleaning: ["residential", "checklist"],
    moving: ["labor", "same-day"],
    tutoring: ["remote", "session"],
    handyman: ["repair", "indoor"],
    creative: ["deliverables", "remote"],
    other: ["custom", "local"],
  };
  const tags = [...base[category]];
  if (/\bsame[- ]?day|today|asap\b/.test(lower)) tags.unshift("same-day");
  if (/\bremote|zoom|online\b/.test(lower)) tags.unshift("remote");
  if (/\boutdoor|yard|lawn\b/.test(lower)) tags.push("outdoor");
  return Array.from(new Set(tags)).slice(0, 5);
}

function audienceFor(category: JobCategory): string {
  const map: Record<JobCategory, string> = {
    cleaning: "Homeowners hiring off Nextdoor / Facebook",
    moving: "Renters coordinating day laborers",
    tutoring: "Parents booking independent tutors",
    handyman: "Homeowners avoiding marketplace fees",
    creative: "Small shops hiring freelancers on WhatsApp",
    other: "Neighbors hiring trusted local help",
  };
  return map[category];
}
