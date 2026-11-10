/** localStorage key for discreet pitch-mode preference (header toggle). */
export const PITCH_MODE_KEY = "pwd_pitch_mode";

export type PitchSlideId =
  | "open"
  | "problem"
  | "solution"
  | "live-jobs"
  | "live-create"
  | "live-admin"
  | "tech"
  | "close";

export type PitchSlide = {
  id: PitchSlideId;
  eyebrow: string;
  title: string;
  body: string;
  /** Optional supporting points — keep short for stage readability */
  points?: string[];
  ctas?: Array<{ href: string; label: string; primary?: boolean }>;
  tone?: "default" | "dark" | "accent";
};

export const PITCH_SLIDES: PitchSlide[] = [
  {
    id: "open",
    eyebrow: "PayPal AI Hackathon",
    title: "PayWhenDone",
    body: "AI-verified PayPal escrow for local gigs hired off-platform — Facebook, Nextdoor, WhatsApp, word of mouth.",
    tone: "dark",
  },
  {
    id: "problem",
    eyebrow: "The problem",
    title: "Off-platform gigs have no protection",
    body: "The moment work is hired in a chat thread, trust breaks. There is no marketplace hold, no dispute button, no shared ground truth.",
    points: [
      "Clients pay upfront and risk a ghost.",
      "Workers finish the job and wait for Venmo that never arrives.",
      "Photos in a group chat are not a contract.",
    ],
  },
  {
    id: "solution",
    eyebrow: "The solution",
    title: "Hold → proof → Muse verify → capture",
    body: "PayWhenDone is not a marketplace. It is escrow rails: authorize funds, prove the work, let Muse judge the brief, then capture or void.",
    points: [
      "PayPal AUTHORIZE reserves money — not captured yet.",
      "Worker uploads photo + notes mapped to acceptance criteria.",
      "Muse Spark returns a verdict; capture follows approval.",
    ],
  },
  {
    id: "live-jobs",
    eyebrow: "Live product",
    title: "Seeded jobs board",
    body: "Open the real Jobs board — demo escrows across cleaning, moving, tutoring, and handyman, with live statuses from the database.",
    ctas: [
      { href: "/jobs", label: "Open Jobs", primary: true },
      { href: "/how-it-works", label: "How it works" },
    ],
  },
  {
    id: "live-create",
    eyebrow: "Live product",
    title: "Create a new escrow",
    body: "Walk the multi-step wizard: brief, acceptance criteria, amount, then hold funds with PayPal sandbox or mock authorize.",
    ctas: [
      { href: "/create", label: "New job", primary: true },
      { href: "/templates", label: "Templates" },
    ],
  },
  {
    id: "live-admin",
    eyebrow: "Live product",
    title: "Operations console",
    body: "Admin dashboard for escrows, ledger, invoices, payouts, and webhooks — the ops view judges expect after the happy path.",
    ctas: [
      { href: "/admin", label: "Open Admin", primary: true },
      { href: "/jobs", label: "Jobs board" },
    ],
  },
  {
    id: "tech",
    eyebrow: "Stack",
    title: "PayPal · Muse AI · passkeys",
    body: "Production-shaped demo rails — sandbox PayPal when keys exist, graceful mock when they do not.",
    points: [
      "PayPal Orders AUTHORIZE, capture, void, refunds, invoicing, payouts, webhooks.",
      "Meta Muse Spark for proof vs brief; mock verdicts when Muse is offline.",
      "Better Auth with email sign-in and optional WebAuthn passkeys.",
    ],
  },
  {
    id: "close",
    eyebrow: "Built by",
    title: "Muhammad Umer Aamir",
    body: "MAC student at Wilfrid Laurier. Full-stack TypeScript and Next.js — PayWhenDone is the hackathon entry: escrow rails, Muse verification, and passkeys in one working demo.",
    ctas: [
      { href: "/about", label: "About", primary: true },
      {
        href: "https://github.com/umeraamir69/pay-when-done",
        label: "GitHub",
      },
    ],
    tone: "accent",
  },
];

export function readPitchModePreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PITCH_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writePitchModePreference(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem(PITCH_MODE_KEY, "1");
    else window.localStorage.removeItem(PITCH_MODE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}
