"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DashboardStats, JobStatus } from "@/lib/types";
import { formatDate, formatMoney, pct, statusLabel } from "@/lib/format";
import { withTopProgress } from "@/lib/top-progress";
import { BusySpinner } from "@/components/TableControls";

const QUICK_LINKS = [
  {
    href: "/admin/jobs",
    title: "Jobs",
    blurb: "Search, filter, release, or void escrows.",
  },
  {
    href: "/admin/ledger",
    title: "Ledger",
    blurb: "Authorize, capture, void, refund, and sync events.",
  },
  {
    href: "/admin/invoices",
    title: "Invoices",
    blurb: "PayPal invoices tied to funded jobs.",
  },
  {
    href: "/admin/payouts",
    title: "Payouts",
    blurb: "Worker payout batches and statuses.",
  },
  {
    href: "/admin/webhooks",
    title: "Webhooks",
    blurb: "Inbound PayPal webhook processing log.",
  },
];

export function AdminOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await withTopProgress(async () => {
        const res = await fetch("/api/admin/stats");
        const json = await res.json();
        setStats(json.stats);
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  async function seedDemo() {
    setBusy(true);
    setMessage(null);
    try {
      await withTopProgress(async () => {
        const res = await fetch("/api/admin/seed", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Seed failed");
        setMessage(`Loaded ${data.count} demo jobs.`);
        await load();
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Seed failed");
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
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Dashboard</h1>
          <p className="muted">
            Escrow volume, Muse decisions, and recent activity — open a resource
            page for full tables and actions.
          </p>
        </div>
        <div className="admin-page-actions">
          <a href="/api/jobs/export" className="btn-ghost">
            Export CSV
          </a>
          <button
            type="button"
            className="btn-ghost"
            onClick={seedDemo}
            disabled={busy || loading}
          >
            {busy ? <BusySpinner label="Working…" /> : "Load demo data"}
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
        <p className="muted panel-loading">
          <BusySpinner label="Loading metrics…" />
        </p>
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
            {!statusBars.length && !loading ? (
              <p className="muted">No pipeline data yet.</p>
            ) : null}
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
        <h2>Quick links</h2>
        <p className="muted" style={{ marginTop: "0.35rem" }}>
          Jump into a resource table. Actions stay on those pages.
        </p>
        <div className="admin-quick-grid">
          {QUICK_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="admin-quick-link">
              <strong>{item.title}</strong>
              <span className="muted">{item.blurb}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
