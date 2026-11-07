import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How it works",
};

const stages = [
  {
    title: "1. Client writes the brief",
    body: "Spell out acceptance criteria a stranger could check: rooms, photos required, what “clean” or “done” means. Ambiguous briefs produce weak AI verdicts — clear briefs unlock fast release.",
  },
  {
    title: "2. PayPal authorizes (holds) funds",
    body: "The client pays through PayPal with intent AUTHORIZE. Money is reserved on their account but not captured yet. If the job falls apart, the hold can be voided.",
  },
  {
    title: "3. Worker submits proof",
    body: "After finishing, the worker uploads a photo and notes that map back to the brief. This is the evidence Muse will judge — not vibes, not promises.",
  },
  {
    title: "4. Muse AI verifies",
    body: "Muse Spark compares image + notes to the brief. It returns approved/rejected, confidence, matched requirements, and what’s still missing.",
  },
  {
    title: "5. Capture or void",
    body: "On approval, PayWhenDone captures the authorization — worker gets paid. On rejection, the client can ask for better proof or void the hold.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="page-shell wide">
      <p className="eyebrow">Flow</p>
      <h1>How PayWhenDone works</h1>
      <p className="lede narrow">
        Escrow without a marketplace. PayPal holds the money. Muse decides when
        the brief is satisfied.
      </p>

      <div className="timeline">
        {stages.map((stage) => (
          <article key={stage.title} className="timeline-item">
            <h2>{stage.title}</h2>
            <p>{stage.body}</p>
          </article>
        ))}
      </div>

      <section className="panel" style={{ marginTop: "2rem" }}>
        <h2>Demo path for judges</h2>
        <ol className="plain-list">
          <li>Create a bathroom-clean job with concrete criteria</li>
          <li>Hold funds (sandbox PayPal or mock)</li>
          <li>Upload a real after-photo + matching notes</li>
          <li>Run Muse verify → release payment</li>
        </ol>
        <div className="cta-row" style={{ marginTop: "1rem" }}>
          <Link href="/create" className="btn-primary">
            Try it now
          </Link>
          <Link href="/faq" className="btn-ghost">
            FAQ
          </Link>
        </div>
      </section>
    </div>
  );
}
