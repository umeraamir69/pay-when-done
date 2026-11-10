"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Job, JobCategory, JobStatus } from "@/lib/types";
import { categoryLabel, formatMoney, statusLabel } from "@/lib/format";
import {
  toggleSort,
  useClientTable,
  type SortDir,
} from "@/lib/use-client-table";
import { PaginationBar } from "@/components/TableControls";

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

const SORT_OPTIONS = [
  { key: "updatedAt", label: "Updated" },
  { key: "title", label: "Title" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
  { key: "category", label: "Category" },
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
    case "amount":
      return job.amount;
    case "status":
      return job.status;
    case "category":
      return job.category;
    case "updatedAt":
      return job.updatedAt;
    default:
      return null;
  }
}

export function JobsList({ initialJobs }: { initialJobs: Job[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<JobStatus | "all">("all");
  const [category, setCategory] = useState<JobCategory | "all">("all");
  const [sortKey, setSortKey] = useState<string>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filterFn = useCallback(
    (job: Job) => {
      if (status !== "all" && job.status !== status) return false;
      if (category !== "all" && job.category !== category) return false;
      return true;
    },
    [status, category],
  );

  useEffect(() => {
    setPage(1);
  }, [q, status, category, pageSize, sortKey, sortDir]);

  const table = useClientTable({
    rows: initialJobs,
    search: q,
    searchFn: jobSearch,
    filterFn,
    sortKey,
    sortDir,
    getSortValue: jobSortValue,
    page,
    pageSize,
  });

  function onSortChange(nextKey: string) {
    const next = toggleSort(sortKey, sortDir, nextKey);
    setSortKey(next.key);
    setSortDir(next.dir);
  }

  if (initialJobs.length === 0) {
    return (
      <div className="empty-state panel">
        <h2>No jobs yet</h2>
        <p className="muted">
          Create an escrow job, or load demo data from the admin dashboard.
        </p>
        <div className="cta-row" style={{ marginTop: 0 }}>
          <Link href="/create" className="btn-primary">
            Create first job
          </Link>
          <Link href="/admin" className="btn-ghost">
            Open admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="jobs-list-shell">
      <div className="jobs-toolbar" role="search">
        <div className="jobs-toolbar-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search jobs…"
            aria-label="Search jobs"
          />
        </div>
        <div className="jobs-toolbar-filters">
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
          <div className="jobs-sort-group">
            <select
              value={sortKey}
              onChange={(e) => onSortChange(e.target.value)}
              aria-label="Sort by"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  Sort: {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="jobs-sort-dir"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              aria-label={`Sort ${sortDir === "asc" ? "descending" : "ascending"}`}
              title={sortDir === "asc" ? "Ascending" : "Descending"}
            >
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>

      {table.total === 0 ? (
        <div className="empty-state panel">
          <h2>No matches</h2>
          <p className="muted">Try a different search or clear the filters.</p>
        </div>
      ) : (
        <>
          <div className="job-list">
            {table.rows.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="job-row">
                <div>
                  <strong>{job.title}</strong>
                  <div className="muted job-row-meta">
                    {job.clientName} → {job.workerName}
                    <span className={`status-chip status-${job.status}`}>
                      {statusLabel(job.status)}
                    </span>
                    <span className="status-chip">
                      {categoryLabel(job.category)}
                    </span>
                    {job.priority === "high" ? (
                      <span className="priority-flag">High</span>
                    ) : null}
                  </div>
                </div>
                <strong className="job-row-amount">
                  {formatMoney(job.amount, job.currency)}
                </strong>
              </Link>
            ))}
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
        </>
      )}
    </div>
  );
}
