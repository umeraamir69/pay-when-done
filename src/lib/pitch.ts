/** localStorage key for discreet pitch-mode preference (header toggle). */
export const PITCH_MODE_KEY = "pwd_pitch_mode";

export type PitchSlideId =
  | "about"
  | "landing"
  | "templates"
  | "create"
  | "jobs"
  | "escrow"
  | "paypal"
  | "disputes"
  | "admin"
  | "account"
  | "close";

/** Which live/demo dataset to surface on a step. */
export type PitchDataKind =
  | "founder"
  | "none"
  | "templates"
  | "jobs-list"
  | "job-escrow"
  | "job-paypal"
  | "job-dispute"
  | "admin"
  | "account";

export type PitchSlide = {
  id: PitchSlideId;
  eyebrow: string;
  title: string;
  body: string;
  /** Optional supporting points — keep short for stage readability */
  points?: string[];
  ctas?: Array<{ href: string; label: string; primary?: boolean }>;
  tone?: "default" | "dark" | "accent";
  dataKind?: PitchDataKind;
  /**
   * When set, primary CTA is rewritten to `/jobs/:id` once the matching
   * seeded job is loaded from the API.
   */
  jobMatch?: string;
};

/** Stable seed titles from prisma/seed.mjs — used to deep-link live demos. */
export const PITCH_SEED = {
  escrowTitle: "Studio move — 2 hours",
  paypalTitle: "SAT math tutoring — 90 min",
  disputeTitle: "Deck railing repair",
  milestoneTitle: "Bathroom deep clean + grout",
  templateCount: 24,
} as const;

/**
 * Guided screen walkthrough for live pitch mode.
 * Starts with founder/About me, then each major product surface with its own data.
 * Nav: Prev / Next, ← → Space, Esc to exit.
 */
export const PITCH_SLIDES: PitchSlide[] = [
  {
    id: "about",
    eyebrow: "0 · About me",
    title: "Muhammad Umer Aamir",
    body: "Founder and builder of PayWhenDone — MAC student at Wilfrid Laurier. Full-stack TypeScript and Next.js; this is the PayPal AI Hackathon entry.",
    points: [
      "Role: Founder · Umer Admin · PayWhenDone builder",
      "Stack: Next.js, Neon Postgres, Better Auth, PayPal sandbox, Muse Spark",
      "Demo login: umer@umer.com (admin allow-list)",
    ],
    ctas: [
      { href: "/about", label: "Open About", primary: true },
      {
        href: "https://www.linkedin.com/in/umeraamir69/",
        label: "LinkedIn",
      },
      {
        href: "https://github.com/umeraamir69/pay-when-done",
        label: "GitHub",
      },
    ],
    tone: "dark",
    dataKind: "founder",
  },
  {
    id: "landing",
    eyebrow: "1 · Landing",
    title: "Problem → escrow solution",
    body: "Off-platform gigs hired in chats have no hold and no shared ground truth. PayWhenDone is AI-verified PayPal escrow — not a marketplace.",
    points: [
      "Clients risk paying a ghost; workers wait on Venmo that never lands.",
      "AUTHORIZE hold → proof → Muse verify → capture or void.",
      "Hero + How it works tell the loop before you touch the wizard.",
    ],
    ctas: [
      { href: "/", label: "Open landing", primary: true },
      { href: "/how-it-works", label: "How it works" },
      { href: "/faq", label: "FAQ" },
    ],
    dataKind: "none",
  },
  {
    id: "templates",
    eyebrow: "2 · Templates",
    title: "Catalog + Ask AI",
    body: "Twenty-four ready briefs across cleaning, moving, tutoring, handyman, and creative — or ask AI to draft a custom template from a description.",
    points: [
      "Search and category filters on /templates.",
      "Ask AI → /api/templates/generate → prefill create.",
      "Each card deep-links into the create wizard.",
    ],
    ctas: [
      { href: "/templates", label: "Open Templates", primary: true },
      { href: "/templates#ask-ai", label: "Ask AI" },
      { href: "/create?template=clean", label: "Start from Bathroom" },
    ],
    dataKind: "templates",
  },
  {
    id: "create",
    eyebrow: "3 · Create job",
    title: "Multi-step escrow wizard",
    body: "Template → details → people → PayPal options → review. Acceptance criteria become the brief Muse judges later.",
    points: [
      "Amount, category, client + worker on the record.",
      "Optional auto-payout to worker on release.",
      "Review confirms everything before the hold screen.",
    ],
    ctas: [
      { href: "/create", label: "New job", primary: true },
      { href: "/create?template=clean", label: "Wizard + template" },
    ],
    dataKind: "none",
  },
  {
    id: "jobs",
    eyebrow: "4 · Jobs list",
    title: "Seeded demo board",
    body: "Pitch seed loads a full ops board for umer@umer.com — funded holds, Muse verdicts, disputes, releases, voids.",
    points: [
      "Filters: status, category, search.",
      "Owned by the demo admin so /api/jobs returns the set.",
      "Open any row into the job workspace.",
    ],
    ctas: [
      { href: "/jobs", label: "Open Jobs", primary: true },
      { href: "/jobs?status=funded", label: "Funded only" },
    ],
    dataKind: "jobs-list",
  },
  {
    id: "escrow",
    eyebrow: "5 · Escrow flow",
    title: "Hold → proof → Muse → release",
    body: "Walk one seeded job end-to-end: AUTHORIZE hold, worker proof, Muse Spark verdict, then capture or void.",
    points: [
      `Hero demo: “${PITCH_SEED.escrowTitle}” — Muse-approved, ready to release.`,
      "Photo + notes map to acceptance criteria.",
      "Verdict gates money: capture on approve, void on reject.",
    ],
    ctas: [
      { href: "/jobs", label: "Open escrow job", primary: true },
      { href: "/how-it-works", label: "State machine" },
    ],
    dataKind: "job-escrow",
    jobMatch: PITCH_SEED.escrowTitle,
  },
  {
    id: "paypal",
    eyebrow: "6 · PayPal panel",
    title: "Ledger-shaped IDs",
    body: "Every money event leaves sandbox-shaped order, auth, capture, invoice, and payout IDs on the job — the same shapes Admin ledger and webhooks show.",
    points: [
      `Closed loop: “${PITCH_SEED.paypalTitle}” — captured + payout SUCCESS.`,
      "AUTHORIZE reserves; capture takes; void never charges.",
      "Pitch-seed IDs mock safely even when live keys are set.",
    ],
    ctas: [
      { href: "/jobs", label: "Open PayPal job", primary: true },
      { href: "/admin/ledger", label: "Ledger" },
      { href: "/admin/payouts", label: "Payouts" },
    ],
    dataKind: "job-paypal",
    jobMatch: PITCH_SEED.paypalTitle,
  },
  {
    id: "disputes",
    eyebrow: "7 · Disputes & milestones",
    title: "When gigs go sideways",
    body: "Dispute threads keep client, worker, and admin notes on the job. Milestones split larger work into titled amounts with their own status.",
    points: [
      `Open dispute: “${PITCH_SEED.disputeTitle}” — railing rework thread.`,
      `Milestones: “${PITCH_SEED.milestoneTitle}” — bathrooms + grout.`,
      "Both live as tabs beside the payment flow.",
    ],
    ctas: [
      { href: "/jobs", label: "Open dispute job", primary: true },
      { href: "/jobs?status=disputed", label: "Disputed filter" },
    ],
    dataKind: "job-dispute",
    jobMatch: PITCH_SEED.disputeTitle,
  },
  {
    id: "admin",
    eyebrow: "8 · Admin",
    title: "Ops console",
    body: "Overview KPIs, jobs table, ledger, invoices, payouts, and webhook inbox — the view judges expect after the happy path.",
    points: [
      "Live counts: jobs, active holds, funds held, released.",
      "CSV export and webhook verification for sandbox events.",
      "Pitch lives in the admin sidebar for stage demos.",
    ],
    ctas: [
      { href: "/admin", label: "Admin overview", primary: true },
      { href: "/admin/jobs", label: "Jobs" },
      { href: "/admin/ledger", label: "Ledger" },
      { href: "/admin/webhooks", label: "Webhooks" },
    ],
    dataKind: "admin",
  },
  {
    id: "account",
    eyebrow: "9 · Account",
    title: "Email-first + optional passkeys",
    body: "Login is email-first: check for a passkey, then password or WebAuthn. Account can register an optional passkey after signup — no clutter on the forms.",
    points: [
      "Better Auth email signup with confirm password.",
      "Protected routes: jobs, create, account, admin.",
      "Demo admin: umer@umer.com on the allow-list.",
    ],
    ctas: [
      { href: "/account", label: "Open Account", primary: true },
      { href: "/login", label: "Log in" },
    ],
    dataKind: "account",
  },
  {
    id: "close",
    eyebrow: "10 · Close",
    title: "Try the live loop",
    body: "Hold → prove → Muse → pay. Judges: create a job, fund a hold, and release when the work checks out.",
    points: [
      "Live: pay-when-done.vercel.app",
      "Pitch: /pitch · About: /about · Jobs: /jobs",
    ],
    ctas: [
      { href: "/jobs", label: "Live Jobs", primary: true },
      { href: "/about", label: "About" },
      {
        href: "https://github.com/umeraamir69/pay-when-done",
        label: "GitHub",
      },
    ],
    tone: "accent",
    dataKind: "none",
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
