"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  DashboardStats,
  InvoiceRecord,
  Job,
  JobCategory,
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
import { withTopProgress } from "@/lib/top-progress";
import {
  toggleSort,
  useClientTable,
  type SortDir,
} from "@/lib/use-client-table";
import { BusySpinner, PaginationBar, SortableTh } from "@/components/TableControls";

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

const CATEGORY_FILTERS: Array<JobCategory | "all"> = [
  "all",
  "cleaning",
  "moving",
  "tutoring",
  "handyman",
  "creative",
  "other",
];

const LEDGER_TYPES = [
  "all",
  "authorize",
  "capture",
  "void",
  "refund",
  "invoice",
  "payout",
  "sync",
  "webhook",
] as const;

function jobSearch(job: Job, q: string) {
  return [job.title, job.clientName, job.workerName, job.workerEmail, ...job.tags]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function jobSortValue(job: Job, key: string) {
  switch (key) {
    case "title":
      return job.title;
    case "parties":
      return `${job.clientName} ${job.workerName}`;
    case "category":
      return job.category;
    case "amount":
      return job.amount;
    case "status":
      return job.status;
    case "updatedAt":
      return job.updatedAt;
    default:
      return null;
  }
}

function ledgerSearch(row: LedgerEntry, q: string) {
  return [row.type, row.jobTitle, row.status, row.paypalId || "", String(row.amount)]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function ledgerSortValue(row: LedgerEntry, key: string) {
  switch (key) {
    case "at":
      return row.at;
    case "type":
      return row.type;
    case "jobTitle":
      return row.jobTitle;
    case "amount":
      return row.amount;
    case "paypalId":
      return row.paypalId || "";
    case "status":
      return row.status;
    default:
      return null;
  }
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEvent[]>([]);
  const [status, setStatus] = useState<JobStatus | "all">("all");
  const [category, setCategory] = useState<JobCategory | "all">("all");
  const [q, setQ] = useState("");
  const [ledgerQ, setLedgerQ] = useState("");
  const [ledgerType, setLedgerType] =
    useState<(typeof LEDGER_TYPES)[number]>("all");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [jobSortKey, setJobSortKey] = useState<string | null>("updatedAt");
  const [jobSortDir, setJobSortDir] = useState<SortDir>("desc");
  const [jobPage, setJobPage] = useState(1);
  const [jobPageSize, setJobPageSize] = useState(10);

  const [ledgerSortKey, setLedgerSortKey] = useState<string | null>("at");
  const [ledgerSortDir, setLedgerSortDir] = useState<SortDir>("desc");
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await withTopProgress(async () => {
        const [statsRes, jobsRes, ledgerRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/jobs"),
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
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  useEffect(() => {
    setJobPage(1);
  }, [q, status, category, jobPageSize]);

  useEffect(() => {
    setLedgerPage(1);
  }, [ledgerQ, ledgerType, ledgerPageSize]);

  const jobFilterFn = useCallback(
    (job: Job) => {
      if (status !== "all" && job.status !== status) return false;
      if (category !== "all" && job.category !== category) return false;
      return true;
    },
    [status, category],
  );

  const jobsTable = useClientTable({
    rows: jobs,
    search: q,
    searchFn: jobSearch,
    filterFn: jobFilterFn,
    sortKey: jobSortKey,
    sortDir: jobSortDir,
    getSortValue: jobSortValue,
    page: jobPage,
    pageSize: jobPageSize,
  });

  const ledgerFilterFn = useCallback(
    (row: LedgerEntry) => {
      if (ledgerType !== "all" && row.type !== ledgerType) return false;
      return true;
    },
    [ledgerType],
  );

  const ledgerTable = useClientTable({
    rows: ledger,
    search: ledgerQ,
    searchFn: ledgerSearch,
    filterFn: ledgerFilterFn,
    sortKey: ledgerSortKey,
    sortDir: ledgerSortDir,
    getSortValue: ledgerSortValue,
    page: ledgerPage,
    pageSize: ledgerPageSize,
  });

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

  async function quickAction(jobId: string, action: "release" | "void") {
    setBusy(true);
    setMessage(null);
    try {
      await withTopProgress(async () => {
        const res = await fetch(`/api/jobs/${jobId}/${action}`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `${action} failed`);
        setMessage(
          `${action === "release" ? "Released" : "Voided"} successfully.`,
        );
        await load();
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  function onJobSort(column: string) {
    const next = toggleSort(jobSortKey, jobSortDir, column);
    setJobSortKey(next.key);
    setJobSortDir(next.dir);
  }

  function onLedgerSort(column: string) {
    const next = toggleSort(ledgerSortKey, ledgerSortDir, column);
    setLedgerSortKey(next.key);
    setLedgerSortDir(next.dir);
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
        <div className="table-toolbar">
          <div>
            <h2>PayPal ledger</h2>
            <p className="muted" style={{ margin: "0.35rem 0 0" }}>
              Authorize, capture, void, invoice, payout, refund, sync, and
              webhook events.
            </p>
          </div>
          <div className="toolbar-controls">
            <input
              value={ledgerQ}
              onChange={(e) => setLedgerQ(e.target.value)}
              placeholder="Search ledger…"
              aria-label="Search ledger"
            />
            <select
              value={ledgerType}
              onChange={(e) =>
                setLedgerType(e.target.value as (typeof LEDGER_TYPES)[number])
              }
              aria-label="Filter ledger type"
            >
              {LEDGER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "all" ? "All types" : t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={`table-wrap${loading ? " is-loading" : ""}`}>
          <table className="admin-table">
            <thead>
              <tr>
                <SortableTh label="When" column="at" sortKey={ledgerSortKey} sortDir={ledgerSortDir} onSort={onLedgerSort} />
                <SortableTh label="Type" column="type" sortKey={ledgerSortKey} sortDir={ledgerSortDir} onSort={onLedgerSort} />
                <SortableTh label="Job" column="jobTitle" sortKey={ledgerSortKey} sortDir={ledgerSortDir} onSort={onLedgerSort} />
                <SortableTh label="Amount" column="amount" sortKey={ledgerSortKey} sortDir={ledgerSortDir} onSort={onLedgerSort} />
                <SortableTh label="PayPal ID" column="paypalId" sortKey={ledgerSortKey} sortDir={ledgerSortDir} onSort={onLedgerSort} />
                <SortableTh label="Status" column="status" sortKey={ledgerSortKey} sortDir={ledgerSortDir} onSort={onLedgerSort} />
              </tr>
            </thead>
            <tbody>
              {ledgerTable.rows.map((row) => (
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
          {!ledgerTable.total ? (
            <p className="muted">No ledger entries yet.</p>
          ) : null}
        </div>
        <PaginationBar
          page={ledgerTable.page}
          pageCount={ledgerTable.pageCount}
          total={ledgerTable.total}
          rangeStart={ledgerTable.rangeStart}
          rangeEnd={ledgerTable.rangeEnd}
          onPageChange={setLedgerPage}
          pageSize={ledgerPageSize}
          onPageSizeChange={setLedgerPageSize}
        />
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
              aria-label="Search jobs"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus | "all")}
              aria-label="Filter by status"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses" : statusLabel(s)}
                </option>
              ))}
            </select>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as JobCategory | "all")
              }
              aria-label="Filter by category"
            >
              {CATEGORY_FILTERS.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All categories" : categoryLabel(c)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`table-wrap${loading ? " is-loading" : ""}`}>
          <table className="admin-table">
            <thead>
              <tr>
                <SortableTh label="Job" column="title" sortKey={jobSortKey} sortDir={jobSortDir} onSort={onJobSort} />
                <SortableTh label="Parties" column="parties" sortKey={jobSortKey} sortDir={jobSortDir} onSort={onJobSort} />
                <SortableTh label="Category" column="category" sortKey={jobSortKey} sortDir={jobSortDir} onSort={onJobSort} />
                <SortableTh label="Amount" column="amount" sortKey={jobSortKey} sortDir={jobSortDir} onSort={onJobSort} />
                <SortableTh label="Status" column="status" sortKey={jobSortKey} sortDir={jobSortDir} onSort={onJobSort} />
                <SortableTh label="Updated" column="updatedAt" sortKey={jobSortKey} sortDir={jobSortDir} onSort={onJobSort} />
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobsTable.rows.map((job) => (
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
          {!jobsTable.total ? (
            <p className="muted" style={{ padding: "1rem 0 0" }}>
              No jobs match. Load demo data or create a job.
            </p>
          ) : null}
        </div>
        <PaginationBar
          page={jobsTable.page}
          pageCount={jobsTable.pageCount}
          total={jobsTable.total}
          rangeStart={jobsTable.rangeStart}
          rangeEnd={jobsTable.rangeEnd}
          onPageChange={setJobPage}
          pageSize={jobPageSize}
          onPageSizeChange={setJobPageSize}
        />
      </section>
    </div>
  );
}
