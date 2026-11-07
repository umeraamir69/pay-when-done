"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PayoutRecord } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/format";
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
import { payoutSearch, payoutSortValue } from "@/lib/admin-table-helpers";

export function AdminPayoutsPanel() {
  const [rows, setRows] = useState<PayoutRecord[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<string | null>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await withTopProgress(async () => {
        const res = await fetch("/api/admin/ledger");
        const json = await res.json();
        setRows(json.payouts || []);
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
  }, [q, pageSize]);

  const table = useClientTable({
    rows,
    search: q,
    searchFn: payoutSearch,
    sortKey,
    sortDir,
    getSortValue: payoutSortValue,
    page,
    pageSize,
  });

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
          <h1>Payouts</h1>
          <p className="muted">
            Worker payout batches after Muse approval and capture.
          </p>
        </div>
        <div className="admin-page-actions">
          <Link href="/admin/ledger" className="btn-ghost">
            View ledger
          </Link>
        </div>
      </div>

      <section className="panel admin-table-panel">
        <div className="table-toolbar">
          <h2>Payout records</h2>
          <div className="toolbar-controls">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search payouts…"
              aria-label="Search payouts"
            />
          </div>
        </div>

        <div className={`table-wrap${loading ? " is-loading" : ""}`}>
          <table className="admin-table">
            <thead>
              <tr>
                <SortableTh
                  label="Created"
                  column="createdAt"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <SortableTh
                  label="Batch"
                  column="batchId"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <SortableTh
                  label="Receiver"
                  column="receiver"
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
                  label="Job"
                  column="jobId"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.createdAt)}</td>
                  <td>
                    <code>{row.batchId}</code>
                    {row.mock ? " · mock" : ""}
                  </td>
                  <td>{row.receiver}</td>
                  <td>{formatMoney(row.amount, row.currency)}</td>
                  <td>{row.status}</td>
                  <td>
                    <Link href={`/jobs/${row.jobId}`}>{row.jobId}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!table.total && !loading ? (
            <p className="muted">No payouts yet.</p>
          ) : null}
          {loading ? (
            <p className="muted panel-loading">
              <BusySpinner label="Loading payouts…" />
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
