"use client";

import { useState } from "react";
import type { Job } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/format";
import { withTopProgress } from "@/lib/top-progress";

type Props = {
  job: Job;
  onUpdate: (job: Job) => void;
};

export function PayPalPaymentsPanel({ job, onUpdate }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [invoiceEmail, setInvoiceEmail] = useState(
    `${job.clientName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
  );

  async function run(action: string, path: string, body?: unknown) {
    setBusy(action);
    setError(null);
    setInfo(null);
    try {
      await withTopProgress(async () => {
        const res = await fetch(`/api/jobs/${job.id}/${path}`, {
          method: "POST",
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `${action} failed`);
        if (data.job) onUpdate(data.job);
        setInfo(
          data.mock
            ? `${action} completed (PayPal mock mode).`
            : `${action} completed via PayPal API.`,
        );
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : `${action} failed`);
    } finally {
      setBusy(null);
    }
  }

  const snap = job.paypal || {};

  return (
    <article className="panel">
      <h2>PayPal money rail</h2>
      <p className="muted">
        Full escrow stack: Orders (authorize) → Capture → Payouts, plus Invoices,
        Refunds, and live Sync against the PayPal sandbox APIs.
      </p>

      {error ? <p className="error">{error}</p> : null}
      {info ? <p className="banner">{info}</p> : null}

      <div className="paypal-id-grid">
        <div>
          <span>Order</span>
          <strong>{job.paypalOrderId || "—"}</strong>
          <em>{snap.orderStatus || ""}</em>
        </div>
        <div>
          <span>Authorization</span>
          <strong>{job.paypalAuthorizationId || "—"}</strong>
          <em>{snap.authorizationStatus || ""}</em>
        </div>
        <div>
          <span>Capture</span>
          <strong>{job.paypalCaptureId || "—"}</strong>
          <em>{snap.captureStatus || ""}</em>
        </div>
        <div>
          <span>Invoice</span>
          <strong>{job.paypalInvoiceId || "—"}</strong>
          <em>{snap.invoiceStatus || ""}</em>
        </div>
        <div>
          <span>Payout batch</span>
          <strong>{job.paypalPayoutBatchId || "—"}</strong>
          <em>{snap.payoutStatus || ""}</em>
        </div>
        <div>
          <span>Refund</span>
          <strong>{job.paypalRefundId || "—"}</strong>
          <em>{snap.refundStatus || ""}</em>
        </div>
      </div>

      {snap.syncedAt ? (
        <p className="muted paypal-sync">
          Last sync {formatDate(snap.syncedAt)}
        </p>
      ) : null}

      <div className="paypal-actions">
        <div className="panel soft-panel">
          <h3>Invoice client</h3>
          <p className="muted">
            PayPal Invoicing API — send a formal invoice for this escrow amount.
          </p>
          <label>
            Recipient email
            <input
              value={invoiceEmail}
              onChange={(e) => setInvoiceEmail(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn-primary"
            disabled={busy === "invoice"}
            onClick={() =>
              run("Invoice", "invoice", { recipientEmail: invoiceEmail })
            }
          >
            {busy === "invoice" ? "Sending…" : "Create & send invoice"}
          </button>
        </div>

        <div className="panel soft-panel">
          <h3>Payout worker</h3>
          <p className="muted">
            PayPal Payouts API → {job.workerEmail} ·{" "}
            {formatMoney(job.amount, job.currency)}
          </p>
          <button
            type="button"
            className="btn-primary"
            disabled={
              busy === "payout" ||
              !["released", "ai_approved"].includes(job.status)
            }
            onClick={() => run("Payout", "payout")}
          >
            {busy === "payout" ? "Sending…" : "Send payout now"}
          </button>
        </div>

        <div className="panel soft-panel">
          <h3>Refund capture</h3>
          <p className="muted">
            Refunds API — reverse a captured payment after release.
          </p>
          <button
            type="button"
            className="btn-ghost"
            disabled={busy === "refund" || job.status !== "released"}
            onClick={() =>
              run("Refund", "refund", {
                note: "PayWhenDone refund after review",
              })
            }
          >
            {busy === "refund" ? "Refunding…" : "Refund client"}
          </button>
        </div>

        <div className="panel soft-panel">
          <h3>Sync from PayPal</h3>
          <p className="muted">
            Pull latest order / authorization / capture status into storage.
          </p>
          <button
            type="button"
            className="btn-ghost"
            disabled={busy === "sync"}
            onClick={() => run("Sync", "sync")}
          >
            {busy === "sync" ? "Syncing…" : "Sync PayPal state"}
          </button>
        </div>
      </div>

      <div className="toggle-summary">
        <span>
          Auto payout on release:{" "}
          <strong>{job.autoPayoutOnRelease ? "On" : "Off"}</strong>
        </span>
        <span>
          Invoice on fund:{" "}
          <strong>{job.createInvoiceOnFund ? "On" : "Off"}</strong>
        </span>
      </div>
    </article>
  );
}
