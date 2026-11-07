"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import {
  JOB_TEMPLATES,
  TEMPLATE_CATEGORIES,
  searchTemplates,
} from "@/lib/templates";
import { categoryLabel, formatMoney } from "@/lib/format";
import type { JobCategory } from "@/lib/types";
import { FadeIn, FadeItem, Stagger } from "@/components/Motion";

type CategoryFilter = JobCategory | "all";

function filterLabel(cat: CategoryFilter) {
  return cat === "all" ? "All" : categoryLabel(cat);
}

export function TemplatesLibrary() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(
    () => searchTemplates(deferredQuery, category),
    [deferredQuery, category],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: JOB_TEMPLATES.length };
    for (const t of JOB_TEMPLATES) {
      map[t.category] = (map[t.category] || 0) + 1;
    }
    return map;
  }, []);

  return (
    <div className="templates-library">
      <FadeIn className="templates-toolbar">
        <label className="templates-search">
          <span className="sr-only">Search templates</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, tag, or keyword…"
            autoComplete="off"
          />
        </label>

        <div
          className="templates-filters"
          role="tablist"
          aria-label="Categories"
        >
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={category === cat}
              className={`chip ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {filterLabel(cat)}
              <span className="templates-filter-count">{counts[cat] || 0}</span>
            </button>
          ))}
        </div>
      </FadeIn>

      <p className="templates-meta muted">
        {results.length} template{results.length === 1 ? "" : "s"}
        {deferredQuery.trim() ? ` matching “${deferredQuery.trim()}”` : ""}
        {category !== "all" ? ` in ${categoryLabel(category)}` : ""}
      </p>

      {results.length === 0 ? (
        <FadeIn className="templates-empty panel">
          <h2>No templates match</h2>
          <p className="muted">
            Try a different keyword, or clear filters and browse the full
            library.
          </p>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            Clear filters
          </button>
        </FadeIn>
      ) : (
        <Stagger className="templates-grid">
          {results.map((template) => (
            <FadeItem key={template.id}>
              <article className="template-card panel">
                <div className="template-card-top">
                  <p className="eyebrow">{categoryLabel(template.category)}</p>
                  <strong className="template-amount">
                    {formatMoney(template.amount)}
                  </strong>
                </div>
                <h2>{template.title}</h2>
                <p className="muted template-audience">{template.audience}</p>
                <p className="brief">{template.brief}</p>
                <div className="job-row-meta">
                  <span className="status-chip">{template.priority}</span>
                  {template.tags.map((tag) => (
                    <span key={tag} className="status-chip">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/create?template=${template.id}`}
                  className="btn-primary template-card-cta"
                >
                  Use template
                </Link>
              </article>
            </FadeItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
