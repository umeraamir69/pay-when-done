"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  DashboardStats,
  InvoiceRecord,
  Job,
  JobStatus,
  LedgerEntry,
  PayoutRecord,
  WebhookEvent,
} from "@/lib/types";
import {
  categoryLabel,
  formatDate,
  formatMoney,
  pct,
  statusLabel,
} from "@/lib/format";

const STATUS_FILTERS: Array<JobStatus | "all"> = [
  "all",
  "awaiting_payment",
  "funded",
  "proof_submitted",
  "ai_approved",
  "ai_rejected",
  "disputed",
  "released",
  "refunded",
  "voided",
];

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEvent[]>([]);
  const [status, setStatus] = useState<JobStatus | "all">("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());

    const [statsRes, jobsRes, ledgerRes] = await Promise.all([
      fetch("/api/admin/stats"),
      fetch(`/api/jobs?${params.toString()}`),
      fetch("/api/admin/ledger"),
    ]);
    const statsJson = await statsRes.json();
    const jobsJson = await jobsRes.json();
    const ledgerJson = await ledgerRes.json();
    setStats(statsJson.stats);
    setJobs(jobsJson.jobs || []);
    setLedger(ledgerJson.ledger || []);
    setInvoices(ledgerJson.invoices || []);
    setPayouts(ledgerJson.payouts || []);
    setWebhooks(ledgerJson.webhooks || []);
  }, [status, q]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  async function seedDemo() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seed failed");
      setMessage(`Loaded ${data.count} demo jobs.`);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Seed failed");
    } finally {
      setBusy(false);
    }
  }

  async function quickAction(jobId: string, action: "release" | "void") {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${action} failed`);
      setMessage(`${action === "release" ? "Released" : "Voided"} successfully.`);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const statusBars = useMemo(() => {
    if (!stats) return [];
    const entries = Object.entries(stats.byStatus);
    const max = Math.max(...entries.map(([, n]) => n), 1);
    return entries.map(([key, value]) => ({
      key,
      value,
      width: `${(value / max) * 100}%`,
    }));
  }, [stats]);

  return (
    <div className="admin-shell">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Admin dashboard</h1>
          <p className="muted">
            Escrow volume, Muse decisions, disputes, and live job controls.
          </p>
        </div>
        <div className="cta-row" style={{ marginTop: 0 }}>
          <a href="/api/jobs/export" className="btn-ghost">
            Export CSV
          </a>
          <button
            type="button"
            className="btn-ghost"
            onClick={seedDemo}
            disabled={busy}
          >
            {busy ? "Working…" : "Load demo data"}
          </button>
          <Link href="/create" className="btn-primary">
            New job
          </Link>
        </div>
      </div>

      {message ? <p className="banner">{message}</p> : null}

      {stats ? (
        <div className="stat-grid">
          <article className="stat-card">
            <span>Total jobs</span>
            <strong>{stats.totalJobs}</strong>
          </article>
          <article className="stat-card">
            <span>Active escrows</span>
            <strong>{stats.activeEscrows}</strong>
          </article>
          <article className="stat-card">
            <span>Funds held</span>
            <strong>{formatMoney(stats.fundsHeld)}</strong>
          </article>
          <article className="stat-card">
            <span>Released</span>
            <strong>{formatMoney(stats.fundsReleased)}</strong>
          </article>
          <article className="stat-card">
            <span>Refunded</span>
            <strong>{formatMoney(stats.fundsRefunded)}</strong>
          </article>
          <article className="stat-card">
            <span>Muse approved</span>
            <strong>{stats.aiApproved}</strong>
          </article>
          <article className="stat-card">
            <span>Invoices</span>
            <strong>{stats.invoicesSent}</strong>
          </article>
          <article className="stat-card">
            <span>Payouts</span>
            <strong>{stats.payoutsSent}</strong>
          </article>
          <article className="stat-card">
            <span>Disputes</span>
            <strong>{stats.disputed}</strong>
          </article>
          <article className="stat-card">
            <span>Avg Muse confidence</span>
            <strong>{pct(stats.avgConfidence)}</strong>
          </article>
        </div>
      ) : (
        <p className="muted">Loading metrics…</p>
      )}

      <div className="admin-columns">
        <section className="panel">
          <h2>Pipeline by status</h2>
          <div className="bar-list">
            {statusBars.map((row) => (
              <div key={row.key} className="bar-row">
                <div className="bar-label">
                  <span>{statusLabel(row.key as JobStatus)}</span>
                  <span>{row.value}</span>
                </div>
                <div className="bar-track">
                  <i style={{ width: row.width }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Recent activity</h2>
          <ul className="activity-feed">
            {(stats?.recentActivity || []).map((event) => (
              <li key={`${event.jobId}-${event.id}`}>
                <Link href={`/jobs/${event.jobId}`}>
                  <strong>{event.jobTitle}</strong>
                </Link>
                <span className="muted">
                  {formatDate(event.at)} · {event.actor}
                </span>
                <p>{event.message}</p>
              </li>
            ))}
            {!stats?.recentActivity?.length ? (
              <li className="muted">No activity yet.</li>
            ) : null}
          </ul>
        </section>
      </div>

      <section className="panel">
        <h2>PayPal ledger</h2>
        <p className="muted">
          Every authorize, capture, void, invoice, payout, refund, sync, and
          webhook — persisted in the local database.
        </p>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Type</th>
                <th>Job</th>
                <th>Amount</th>
                <th>PayPal ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ledger.slice(0, 20).map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.at)}</td>
                  <td>{row.type}</td>
                  <td>
                    <Link href={`/jobs/${row.jobId}`}>{row.jobTitle}</Link>
                  </td>
                  <td>{formatMoney(row.amount, row.currency)}</td>
                  <td>
                    <code>{row.paypalId || "—"}</code>
                  </td>
                  <td>
                    {row.status}
                    {row.mock ? " · mock" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!ledger.length ? (
            <p className="muted">No ledger entries yet.</p>
          ) : null}
        </div>
        <div className="mini-stats">
          <span>{invoices.length} invoices</span>
          <span>{payouts.length} payouts</span>
          <span>{webhooks.length} webhooks</span>
        </div>
      </section>

      <section className="panel admin-table-panel">
        <div className="table-toolbar">
          <h2>All jobs</h2>
          <div className="toolbar-controls">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, client, worker…"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus | "all")}
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses" : statusLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Parties</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <Link href={`/jobs/${job.id}`}>
                      <strong>{job.title}</strong>
                    </Link>
                    {job.priority === "high" ? (
                      <span className="priority-flag">High</span>
                    ) : null}
                  </td>
                  <td>
                    {job.clientName}
                    <div className="muted">{job.workerName}</div>
                  </td>
                  <td>{categoryLabel(job.category)}</td>
                  <td>{formatMoney(job.amount, job.currency)}</td>
                  <td>
                    <span className={`status-chip status-${job.status}`}>
                      {statusLabel(job.status)}
                    </span>
                  </td>
                  <td>{formatDate(job.updatedAt)}</td>
                  <td>
                    <div className="table-actions">
                      <Link href={`/jobs/${job.id}`}>Open</Link>
                      {job.status === "ai_approved" ? (
                        <button
                          type="button"
                          onClick={() => quickAction(job.id, "release")}
                          disabled={busy}
                        >
                          Release
                        </button>
                      ) : null}
                      {[
                        "funded",
                        "proof_submitted",
                        "ai_rejected",
                        "disputed",
                      ].includes(job.status) ? (
                        <button
                          type="button"
                          onClick={() => quickAction(job.id, "void")}
                          disabled={busy}
                        >
                          Void
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!jobs.length ? (
            <p className="muted" style={{ padding: "1rem 0 0" }}>
              No jobs match. Load demo data or create a job.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
