"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { LedgerEntry } from "@/lib/types";
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
import {
  LEDGER_TYPES,
  ledgerSearch,
  ledgerSortValue,
} from "@/lib/admin-table-helpers";

export function AdminLedgerPanel() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [counts, setCounts] = useState({
    invoices: 0,
    payouts: 0,
    webhooks: 0,
  });
  const [q, setQ] = useState("");
  const [type, setType] = useState<(typeof LEDGER_TYPES)[number]>("all");
  const [loading, setLoading] = useState(true);

  const [sortKey, setSortKey] = useState<string | null>("at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await withTopProgress(async () => {
        const res = await fetch("/api/admin/ledger");
        const json = await res.json();
        setLedger(json.ledger || []);
        setCounts({
          invoices: (json.invoices || []).length,
          payouts: (json.payouts || []).length,
          webhooks: (json.webhooks || []).length,
        });
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
  }, [q, type, pageSize]);

  const filterFn = useCallback(
    (row: LedgerEntry) => {
      if (type !== "all" && row.type !== type) return false;
      return true;
    },
    [type],
  );

  const table = useClientTable({
    rows: ledger,
    search: q,
    searchFn: ledgerSearch,
    filterFn,
    sortKey,
    sortDir,
    getSortValue: ledgerSortValue,
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
          <h1>PayPal ledger</h1>
          <p className="muted">
            Every authorize, capture, void, invoice, payout, refund, sync, and
            webhook — persisted in the database.
          </p>
        </div>
        <div className="admin-page-actions">
          <Link href="/admin/invoices" className="btn-ghost">
            Invoices ({counts.invoices})
          </Link>
          <Link href="/admin/payouts" className="btn-ghost">
            Payouts ({counts.payouts})
          </Link>
          <Link href="/admin/webhooks" className="btn-ghost">
            Webhooks ({counts.webhooks})
          </Link>
        </div>
      </div>

      <section className="panel admin-table-panel">
        <div className="table-toolbar">
          <h2>Ledger entries</h2>
          <div className="toolbar-controls">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search ledger…"
              aria-label="Search ledger"
            />
            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as (typeof LEDGER_TYPES)[number])
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
                <SortableTh
                  label="When"
                  column="at"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <SortableTh
                  label="Type"
                  column="type"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <SortableTh
                  label="Job"
                  column="jobTitle"
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
                  label="PayPal ID"
                  column="paypalId"
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
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
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
          {!table.total && !loading ? (
            <p className="muted">No ledger entries yet.</p>
          ) : null}
          {loading ? (
            <p className="muted panel-loading">
              <BusySpinner label="Loading ledger…" />
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
