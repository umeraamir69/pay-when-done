"use client";

import type { SortDir } from "@/lib/use-client-table";

export function SortableTh({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  column: string;
  sortKey: string | null;
  sortDir: SortDir;
  onSort: (column: string) => void;
}) {
  const active = sortKey === column;
  return (
    <th>
      <button
        type="button"
        className={`sort-th${active ? " is-active" : ""}`}
        onClick={() => onSort(column)}
        aria-sort={
          active ? (sortDir === "asc" ? "ascending" : "descending") : "none"
        }
      >
        {label}
        <span className="sort-indicator" aria-hidden>
          {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}

export function PaginationBar({
  page,
  pageCount,
  total,
  rangeStart,
  rangeEnd,
  onPageChange,
  pageSize,
  onPageSizeChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}) {
  if (total === 0) return null;

  return (
    <div className="pagination-bar">
      <p className="muted pagination-meta">
        Showing {rangeStart}–{rangeEnd} of {total}
      </p>
      <div className="pagination-controls">
        {onPageSizeChange && pageSize != null ? (
          <label className="page-size">
            <span className="sr-only">Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {[10, 15, 20].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button
          type="button"
          className="btn-ghost pagination-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </button>
        <span className="pagination-page">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          className="btn-ghost pagination-btn"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function BusySpinner({ label }: { label?: string }) {
  return (
    <span className="busy-inline">
      <span className="btn-spinner" aria-hidden />
      {label ? <span>{label}</span> : null}
    </span>
  );
}
