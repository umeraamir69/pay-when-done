"use client";

import { useMemo } from "react";

export type SortDir = "asc" | "desc";

type UseClientTableArgs<T> = {
  rows: T[];
  search?: string;
  searchFn?: (row: T, query: string) => boolean;
  filterFn?: (row: T) => boolean;
  sortKey?: string | null;
  sortDir?: SortDir;
  getSortValue?: (row: T, key: string) => string | number | null | undefined;
  page: number;
  pageSize?: number;
};

export function useClientTable<T>({
  rows,
  search = "",
  searchFn,
  filterFn,
  sortKey = null,
  sortDir = "asc",
  getSortValue,
  page,
  pageSize = 10,
}: UseClientTableArgs<T>) {
  const filtered = useMemo(() => {
    let next = rows;
    if (filterFn) next = next.filter(filterFn);
    const q = search.trim().toLowerCase();
    if (q && searchFn) next = next.filter((row) => searchFn(row, q));
    return next;
  }, [rows, search, searchFn, filterFn]);

  const sorted = useMemo(() => {
    if (!sortKey || !getSortValue) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      if (as < bs) return sortDir === "asc" ? -1 : 1;
      if (as > bs) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortKey, sortDir, getSortValue]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  return {
    rows: pageRows,
    total: sorted.length,
    pageCount,
    page: safePage,
    pageSize,
    rangeStart: sorted.length === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + pageSize, sorted.length),
  };
}

export function toggleSort(
  currentKey: string | null,
  currentDir: SortDir,
  nextKey: string,
): { key: string; dir: SortDir } {
  if (currentKey === nextKey) {
    return { key: nextKey, dir: currentDir === "asc" ? "desc" : "asc" };
  }
  return { key: nextKey, dir: "asc" };
}
