import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Architecture" };

export default function ArchitectureDocPage() {
  return (
    <div className="page-shell wide">
      <p className="eyebrow">Docs</p>
      <h1>Architecture</h1>
      <p className="lede narrow">
        How PayWhenDone layers auth, storage, PayPal, and Muse. Full write-up in{" "}
        <code>docs/ARCHITECTURE.md</code>.
      </p>

      <pre className="code-block" style={{ marginTop: "1.25rem" }}>{`User (passkey / email)
   └─ Better Auth session
        └─ Next.js App Router UI
             ├─ Prisma (SQLite → Neon Postgres)
             ├─ PayPal sandbox APIs
             │    Orders → Authorize → Capture / Void
             │    Invoice · Payout · Refund · Webhooks
             └─ Muse Model API
                  proof image + notes vs brief → verdict`}</pre>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h2>Money state machine</h2>
        <ol className="plain-list">
          <li>
            <code>awaiting_payment</code> — job created
          </li>
          <li>
            <code>funded</code> — PayPal authorization held
          </li>
          <li>
            <code>proof_submitted</code> — worker evidence uploaded
          </li>
          <li>
            <code>ai_approved</code> / <code>ai_rejected</code> — Muse verdict
          </li>
          <li>
            <code>released</code> — capture (+ optional payout)
          </li>
          <li>
            <code>voided</code> / <code>refunded</code> / <code>disputed</code>
          </li>
        </ol>
      </section>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h2>Key modules</h2>
        <ul className="feature-checklist">
          <li>
            <code>src/lib/auth.ts</code> — Better Auth + passkey plugin
          </li>
          <li>
            <code>src/lib/prisma.ts</code> — database client
          </li>
          <li>
            <code>src/lib/store.ts</code> — job/ledger domain API
          </li>
          <li>
            <code>src/lib/paypal.ts</code> — PayPal SDK-less REST wrappers
          </li>
          <li>
            <code>src/lib/ai.ts</code> — Muse verifier
          </li>
        </ul>
      </section>

      <div className="cta-row">
        <Link href="/docs" className="btn-ghost">
          Docs home
        </Link>
        <Link href="/docs/features" className="btn-primary">
          Features
        </Link>
      </div>
    </div>
  );
}
