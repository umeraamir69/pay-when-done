/** localStorage key for discreet pitch-mode preference (header toggle). */
export const PITCH_MODE_KEY = "pwd_pitch_mode";

export type PitchSlideId =
  | "open"
  | "problem"
  | "signup"
  | "create"
  | "hold"
  | "proof"
  | "muse"
  | "capture-void"
  | "invoice-payout"
  | "disputes-milestones"
  | "admin"
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

/**
 * Full start→end demo story for live pitch mode.
 * Nav: Prev / Next buttons, ← → Space, Esc to exit.
 */
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
    eyebrow: "1 · Problem",
    title: "Off-platform gigs have no protection",
    body: "The moment work is hired in a chat thread, trust breaks. There is no marketplace hold, no dispute button, no shared ground truth.",
    points: [
      "Clients pay upfront and risk a ghost.",
      "Workers finish the job and wait for Venmo that never arrives.",
      "Photos in a group chat are not a contract.",
    ],
    ctas: [
      { href: "/how-it-works", label: "How it works", primary: true },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    id: "signup",
    eyebrow: "2 · Sign up",
    title: "Email-first auth, optional passkey",
    body: "Judges sign up with email + password. Login asks for email first, checks for a passkey, then offers password or WebAuthn — no passkey clutter on the form.",
    points: [
      "Better Auth email signup with confirm password.",
      "After auth, Account can register an optional passkey.",
      "Protected routes: jobs, create, account, admin.",
    ],
    ctas: [
      { href: "/signup", label: "Sign up", primary: true },
      { href: "/login", label: "Log in" },
      { href: "/account", label: "Account / passkeys" },
    ],
  },
  {
    id: "create",
    eyebrow: "3 · Create job",
    title: "Multi-step escrow wizard",
    body: "Walk template → details → people → PayPal options → review. Clear acceptance criteria become the brief Muse will judge later.",
    points: [
      "Start from a template or write a blank brief.",
      "Amount, category, client + worker email on the record.",
      "Review confirms everything before the PayPal hold screen.",
    ],
    ctas: [
      { href: "/create", label: "New job", primary: true },
      { href: "/templates", label: "Templates" },
    ],
  },
  {
    id: "hold",
    eyebrow: "4 · PayPal hold",
    title: "AUTHORIZE — reserve, don't capture",
    body: "The client funds the job with PayPal intent AUTHORIZE. Money is reserved on their account but not taken yet. Sandbox when keys exist; mock authorize when they don't.",
    points: [
      "Hold sits on the job until Muse approves or the client voids.",
      "Orders API + webhooks keep status in sync.",
      "Open the job workspace to see the live escrow state.",
    ],
    ctas: [
      { href: "/jobs", label: "Open Jobs", primary: true },
      { href: "/create", label: "Create & fund" },
      { href: "/docs/architecture", label: "State machine" },
    ],
  },
  {
    id: "proof",
    eyebrow: "5 · Proof",
    title: "Worker submits evidence",
    body: "After the work is done, the worker uploads a photo and notes that map back to the acceptance criteria — the evidence Muse will judge.",
    points: [
      "Photo + notes, not vibes or promises.",
      "Available while the job is funded, rejected, or disputed.",
      "Re-submit if Muse asks for clearer proof.",
    ],
    ctas: [{ href: "/jobs", label: "Jobs board", primary: true }],
  },
  {
    id: "muse",
    eyebrow: "6 · Muse verify",
    title: "AI compares proof to the brief",
    body: "Muse Spark reads image + notes against the job criteria and returns approved or rejected with confidence, matches, and what's still missing.",
    points: [
      "Meta Muse (`muse-spark-1.3`) when MODEL_API_KEY is set.",
      "Graceful mock verdicts when Muse is offline — demo never dies.",
      "Verdict gates the money action: capture vs hold/void.",
    ],
    ctas: [
      { href: "/jobs", label: "Try verify", primary: true },
      { href: "/how-it-works", label: "How it works" },
    ],
  },
  {
    id: "capture-void",
    eyebrow: "7 · Capture or void",
    title: "Release payment — or cancel the hold",
    body: "On Muse approval, capture the authorization and pay the worker. On rejection or a dead job, void the hold so the client is never charged.",
    points: [
      "Capture → status released + PayPal capture id on the record.",
      "Void → authorization cancelled; funds never leave the client.",
      "Refund path available after capture when needed.",
    ],
    ctas: [{ href: "/jobs", label: "Open a funded job", primary: true }],
  },
  {
    id: "invoice-payout",
    eyebrow: "8 · Invoice & payout",
    title: "PayPal invoice + worker payout",
    body: "After release, optionally send a PayPal invoice for the record and push a payout to the worker — the settlement layer on top of capture.",
    points: [
      "Invoicing and payouts use sandbox PayPal APIs.",
      "Receipt page shows the closed escrow for client and worker.",
      "Ledger rows land in Admin for every money event.",
    ],
    ctas: [
      { href: "/admin/invoices", label: "Invoices", primary: true },
      { href: "/admin/payouts", label: "Payouts" },
      { href: "/admin/ledger", label: "Ledger" },
    ],
  },
  {
    id: "disputes-milestones",
    eyebrow: "9 · Edge cases",
    title: "Disputes and milestones",
    body: "Real gigs go sideways. A dispute thread lets client, worker, or admin leave notes. Milestones split larger jobs into titled amounts with their own status.",
    points: [
      "Opening a dispute marks the job disputed until resolved.",
      "Milestones track partial delivery without inventing a marketplace.",
      "Both live as tabs on the job workspace next to payments.",
    ],
    ctas: [{ href: "/jobs", label: "Job workspace", primary: true }],
  },
  {
    id: "admin",
    eyebrow: "10 · Ops",
    title: "Admin console",
    body: "Escrows, ledger, invoices, payouts, webhooks, and CSV export — the ops view judges expect after the happy path.",
    points: [
      "Live counts for jobs, active holds, funds held, and released.",
      "Webhook inbox for PayPal event verification.",
      "Pitch lives in the admin sidebar for stage demos.",
    ],
    ctas: [
      { href: "/admin", label: "Open Admin", primary: true },
      { href: "/admin/webhooks", label: "Webhooks" },
      { href: "/jobs", label: "Jobs board" },
    ],
  },
  {
    id: "close",
    eyebrow: "11 · Close",
    title: "Muhammad Umer Aamir",
    body: "MAC student at Wilfrid Laurier. Full-stack TypeScript and Next.js — PayWhenDone is the hackathon entry: escrow rails, Muse verification, and passkeys in one working demo.",
    ctas: [
      { href: "/about", label: "About", primary: true },
      { href: "/jobs", label: "Live Jobs" },
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
