import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How it works",
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

const paypalApis = [
  "Orders v2 — create & AUTHORIZE",
  "Payments — capture / void authorization",
  "Refunds on captured payments",
  "Invoicing v2 — create & send",
  "Payouts v1 — to worker email",
  "Webhooks — ledger sync at /api/webhooks/paypal",
];

const audiences = [
  {
    title: "Clients",
    body: "Hiring a cleaner, tutor, mover, or handyman from Facebook, Nextdoor, WhatsApp, or word of mouth — and want the money held until the brief is met.",
  },
  {
    title: "Workers",
    body: "Already booked for a gig and need proof-backed release so finished work does not wait on a Venmo that never arrives.",
  },
  {
    title: "Judges & builders",
    body: "Walking the PayPal sandbox + Muse verification loop end to end without standing up a marketplace.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="page-shell wide">
      <p className="eyebrow">Flow</p>
      <h1>How PayWhenDone works</h1>
      <p className="lede narrow">
        Escrow without a marketplace. PayPal holds the money. Muse decides when
        the brief is satisfied. Meet the builder on{" "}
        <Link href="/about">About</Link>.
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
          Hold → prove → verify → pay. Same loop clients and workers run in the
          app.
        </p>
        <ol className="steps-rail">
          {flow.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong>
              <span>{step.body}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="about-section">
        <p className="eyebrow">Walkthrough</p>
        <h2>Stage by stage</h2>
        <div className="timeline">
          {stages.map((stage) => (
            <article key={stage.title} className="timeline-item">
              <h3>{stage.title}</h3>
              <p>{stage.body}</p>
            </article>
          ))}
        </div>
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

      <section className="about-section">
        <p className="eyebrow">Audience</p>
        <h2>Who it’s for</h2>
        <div className="split-grid about-split how-audience-grid">
          {audiences.map((item) => (
            <article key={item.title} className="story-block">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel demo-panel">
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
          <Link href="/about" className="btn-ghost">
            About the builder
          </Link>
        </div>
      </section>
    </div>
  );
}
