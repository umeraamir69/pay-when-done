"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { WebhookEvent } from "@/lib/types";
import { formatDate } from "@/lib/format";
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
import { webhookSearch, webhookSortValue } from "@/lib/admin-table-helpers";

export function AdminWebhooksPanel() {
  const [rows, setRows] = useState<WebhookEvent[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<string | null>("receivedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await withTopProgress(async () => {
        const res = await fetch("/api/admin/ledger");
        const json = await res.json();
        setRows(json.webhooks || []);
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
    searchFn: webhookSearch,
    sortKey,
    sortDir,
    getSortValue: webhookSortValue,
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
          <h1>Webhooks</h1>
          <p className="muted">
            Inbound PayPal webhook events and processing status.
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
          <h2>Webhook events</h2>
          <div className="toolbar-controls">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search webhooks…"
              aria-label="Search webhooks"
            />
          </div>
        </div>

        <div className={`table-wrap${loading ? " is-loading" : ""}`}>
          <table className="admin-table">
            <thead>
              <tr>
                <SortableTh
                  label="Received"
                  column="receivedAt"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <SortableTh
                  label="Event"
                  column="eventType"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <SortableTh
                  label="Resource"
                  column="resourceId"
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
                <SortableTh
                  label="Processed"
                  column="processed"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.receivedAt)}</td>
                  <td>{row.eventType}</td>
                  <td>
                    <code>{row.resourceId || "—"}</code>
                  </td>
                  <td>
                    {row.jobId ? (
                      <Link href={`/jobs/${row.jobId}`}>{row.jobId}</Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{row.processed ? "Yes" : "Pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!table.total && !loading ? (
            <p className="muted">No webhooks yet.</p>
          ) : null}
          {loading ? (
            <p className="muted panel-loading">
              <BusySpinner label="Loading webhooks…" />
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
