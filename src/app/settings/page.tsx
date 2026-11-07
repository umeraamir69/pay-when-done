import type { Metadata } from "next";
import Link from "next/link";
import { isPayPalMock } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Settings",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession();
  const museConfigured = Boolean(
    process.env.MODEL_API_KEY || process.env.MUSE_API_KEY,
  );
  const museModel = process.env.MUSE_MODEL || "muse-spark-1.3";
  const paypalMock = isPayPalMock();

  const [jobs, ledger, invoices, payouts, webhooks, users, passkeys] =
    await Promise.all([
      prisma.job.count(),
      prisma.ledgerEntry.count(),
      prisma.invoiceRecord.count(),
      prisma.payoutRecord.count(),
      prisma.webhookEvent.count(),
      prisma.user.count(),
      prisma.passkey.count(),
    ]);

  return (
    <div className="page-shell wide">
      <p className="eyebrow">Configuration</p>
      <h1>Settings & storage</h1>
      <p className="lede narrow">
        Auth (passkeys), Prisma SQLite database, PayPal APIs, and Muse AI status.
      </p>

      <div className="settings-grid">
        <article className="panel">
          <h2>Account</h2>
          <dl className="settings-dl">
            <div>
              <dt>Signed in</dt>
              <dd className={session ? "ok" : "bad"}>
                {session ? session.user.email : "Not signed in"}
              </dd>
            </div>
            <div>
              <dt>Auth</dt>
              <dd>Better Auth + Passkeys</dd>
            </div>
            <div>
              <dt>Users / passkeys</dt>
              <dd>
                {users} / {passkeys}
              </dd>
            </div>
          </dl>
          <div className="cta-row" style={{ marginTop: "1rem" }}>
            <Link href="/account" className="btn-primary">
              Manage passkeys
            </Link>
            {!session ? (
              <Link href="/login" className="btn-ghost">
                Sign in
              </Link>
            ) : null}
          </div>
        </article>

        <article className="panel">
          <h2>Database</h2>
          <dl className="settings-dl">
            <div>
              <dt>Engine</dt>
              <dd>Prisma + SQLite</dd>
            </div>
            <div>
              <dt>File</dt>
              <dd>prisma/dev.db</dd>
            </div>
            <div>
              <dt>Production upgrade</dt>
              <dd>Neon / Supabase Postgres</dd>
            </div>
            <div>
              <dt>Jobs / ledger</dt>
              <dd>
                {jobs} / {ledger}
              </dd>
            </div>
            <div>
              <dt>Invoices / payouts / webhooks</dt>
              <dd>
                {invoices} / {payouts} / {webhooks}
              </dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <h2>PayPal + Muse</h2>
          <dl className="settings-dl">
            <div>
              <dt>PayPal mode</dt>
              <dd className={paypalMock ? "bad" : "ok"}>
                {paypalMock ? "Mock (add sandbox keys)" : "Sandbox live"}
              </dd>
            </div>
            <div>
              <dt>Muse key</dt>
              <dd className={museConfigured ? "ok" : "bad"}>
                {museConfigured ? "Configured" : "Missing"}
              </dd>
            </div>
            <div>
              <dt>Muse model</dt>
              <dd>{museModel}</dd>
            </div>
          </dl>
          <ul className="feature-checklist">
            <li>Orders authorize / capture / void</li>
            <li>Invoices + Payouts + Refunds</li>
            <li>Webhooks + sync</li>
            <li>Passkey login every visit</li>
          </ul>
        </article>
      </div>

      <div className="cta-row">
        <Link href="/admin" className="btn-primary">
          Open admin
        </Link>
        <Link href="/create" className="btn-ghost">
          Create job
        </Link>
      </div>
    </div>
  );
}
