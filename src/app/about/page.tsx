import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

const flow = [
  {
    title: "Hold",
    body: "Client pays with PayPal intent AUTHORIZE — funds reserved, not captured.",
  },
  {
    title: "Prove",
    body: "Worker uploads a photo and notes that map back to the written brief.",
  },
  {
    title: "Verify",
    body: "Muse Spark compares proof to acceptance criteria and returns a verdict.",
  },
  {
    title: "Pay",
    body: "On approval, capture the authorization. On rejection, resubmit or void.",
  },
];

const paypalApis = [
  "Orders v2 — create & AUTHORIZE",
  "Payments — capture / void authorization",
  "Refunds on captured payments",
  "Invoicing v2 — create & send",
  "Payouts v1 — to worker email",
  "Webhooks — ledger sync at /api/webhooks/paypal",
];

export default function AboutPage() {
  return (
    <div className="page-shell wide">
      <p className="eyebrow">About</p>
      <h1>PayWhenDone</h1>
      <p className="lede narrow">
        AI-verified PayPal escrow for local gigs hired off-platform — Facebook,
        Nextdoor, WhatsApp, word of mouth. Not a marketplace. Just hold → prove
        → verify → pay.
      </p>

      <section className="about-section">
        <p className="eyebrow">The problem</p>
        <h2>Trust breaks the moment you leave the marketplace</h2>
        <div className="split-grid about-split">
          <article className="story-block">
            <h3>Client risk</h3>
            <p>
              Pay a cleaner or handyman upfront from a chat thread. They ghost.
              No dispute button, no hold, no recourse.
            </p>
          </article>
          <article className="story-block">
            <h3>Worker risk</h3>
            <p>
              Finish the job, send photos, wait for Venmo that never arrives.
              Labor already left the building.
            </p>
          </article>
        </div>
      </section>

      <section className="about-section">
        <p className="eyebrow">Product</p>
        <h2>Four steps. One escrow.</h2>
        <p className="muted about-section-lede">
          Same application story as the walkthrough — condensed for judges and
          newcomers.
        </p>
        <ol className="steps-rail">
          {flow.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong>
              <span>{step.body}</span>
            </li>
          ))}
        </ol>
        <p className="muted" style={{ marginTop: "1rem" }}>
          Full stage-by-stage brief → authorize → proof → Muse → capture path:{" "}
          <Link href="/how-it-works">How it works</Link>.
        </p>
      </section>

      <section className="about-section">
        <p className="eyebrow">Rails</p>
        <h2>PayPal + Muse</h2>
        <div className="split-grid about-split">
          <article className="panel">
            <h3>PayPal APIs used</h3>
            <ul className="plain-list about-api-list">
              {paypalApis.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="muted" style={{ marginTop: "0.85rem" }}>
              Sandbox keys preferred; mock authorize/capture when keys are
              absent so demos still run.
            </p>
          </article>
          <article className="panel">
            <h3>Muse verification</h3>
            <p>
              Meta Muse Spark reads the proof image and worker notes against the
              brief. It returns approved/rejected, confidence, matched
              requirements, and what’s still missing — then gates capture or
              void.
            </p>
            <p className="muted" style={{ marginTop: "0.75rem" }}>
              Rejection does not auto-void. Workers can resubmit better proof;
              clients can void the hold.
            </p>
          </article>
        </div>
      </section>

      <section className="panel demo-panel" style={{ marginTop: "0.5rem" }}>
        <p className="eyebrow">Try it</p>
        <h2>Demo path for judges</h2>
        <p className="muted demo-panel-lede">
          Walk the full escrow loop in sandbox — brief, hold, proof, verify,
          release.
        </p>
        <ol className="plain-list">
          <li>Create a bathroom-clean job with concrete criteria</li>
          <li>Hold funds (sandbox PayPal or mock)</li>
          <li>Upload a real after-photo + matching notes</li>
          <li>Run Muse verify → release payment</li>
        </ol>
        <div className="cta-row section-cta">
          <Link href="/create" className="btn-primary">
            Try it now
          </Link>
          <Link href="/how-it-works" className="btn-ghost">
            Full walkthrough
          </Link>
        </div>
      </section>

      <section className="about-section about-builder">
        <p className="eyebrow">Built by</p>
        <h2>Muhammad Umer Aamir</h2>
        <p className="muted about-section-lede">
          MAC student at Wilfrid Laurier in the Brantford / Waterloo area. I
          ship full-stack work in TypeScript and Next.js — from security tools
          like SecSentry to ApplySafe for Canadian job-scam checks. PayWhenDone
          is my PayPal AI Hackathon entry: sandbox escrow rails, Muse
          verification, and passkeys in one working demo.
        </p>
        <div className="cta-row section-cta">
          <a
            href="https://github.com/umeraamir69/pay-when-done"
            className="btn-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub repo
          </a>
          <a
            href="https://github.com/umeraamir69"
            className="btn-ghost"
            target="_blank"
            rel="noopener noreferrer"
          >
            Profile
          </a>
          <a
            href="https://www.linkedin.com/in/umeraamir69/"
            className="btn-ghost"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        </div>
      </section>
    </div>
  );
}
