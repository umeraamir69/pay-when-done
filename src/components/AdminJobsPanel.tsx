"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Job, JobCategory, JobStatus } from "@/lib/types";
import {
  categoryLabel,
  formatDate,
  formatMoney,
  statusLabel,
} from "@/lib/format";
import { withTopProgress } from "@/lib/top-progress";
import {
  toggleSort,
  useClientTable,
  type SortDir,
} from "@/lib/use-client-table";
import {
  BusySpinner,
  PaginationBar,
  SortableTh,
} from "@/components/TableControls";
import {
  CATEGORY_FILTERS,
  STATUS_FILTERS,
  categoryOptionLabel,
  jobSearch,
  jobSortValue,
  statusOptionLabel,
} from "@/lib/admin-table-helpers";

export function AdminJobsPanel() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState<JobStatus | "all">("all");
  const [category, setCategory] = useState<JobCategory | "all">("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<string | null>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await withTopProgress(async () => {
        const res = await fetch("/api/jobs");
        const json = await res.json();
        setJobs(json.jobs || []);
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [q, status, category, pageSize]);

  const filterFn = useCallback(
    (job: Job) => {
      if (status !== "all" && job.status !== status) return false;
      if (category !== "all" && job.category !== category) return false;
      return true;
    },
    [status, category],
  );

  const table = useClientTable({
    rows: jobs,
    search: q,
    searchFn: jobSearch,
    filterFn,
    sortKey,
    sortDir,
    getSortValue: jobSortValue,
    page,
    pageSize,
  });

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

  function onSort(column: string) {
    const next = toggleSort(sortKey, sortDir, column);
    setSortKey(next.key);
    setSortDir(next.dir);
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Console</p>
          <h1>Jobs</h1>
          <p className="muted">
            Filter escrows, open workspaces, and run release or void actions.
          </p>
        </div>
        <div className="admin-page-actions">
          <a href="/api/jobs/export" className="btn-ghost">
            Export CSV
          </a>
          <Link href="/create" className="btn-primary">
            New job
          </Link>
        </div>
      </div>

      {message ? <p className="banner">{message}</p> : null}

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
                  {statusOptionLabel(s)}
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
                  {categoryOptionLabel(c)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`table-wrap${loading ? " is-loading" : ""}`}>
          <table className="admin-table">
            <thead>
              <tr>
                <SortableTh
                  label="Job"
                  column="title"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <SortableTh
                  label="Parties"
                  column="parties"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <SortableTh
                  label="Category"
                  column="category"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <SortableTh
                  label="Amount"
                  column="amount"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <SortableTh
                  label="Status"
                  column="status"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <SortableTh
                  label="Updated"
                  column="updatedAt"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((job) => (
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
          {!table.total && !loading ? (
            <p className="muted" style={{ padding: "1rem 0 0" }}>
              No jobs match. Load demo data from the dashboard or create a job.
            </p>
          ) : null}
          {loading ? (
            <p className="muted panel-loading">
              <BusySpinner label="Loading jobs…" />
            </p>
          ) : null}
        </div>
        <PaginationBar
          page={table.page}
          pageCount={table.pageCount}
          total={table.total}
          rangeStart={table.rangeStart}
          rangeEnd={table.rangeEnd}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      </section>
    </div>
  );
}
