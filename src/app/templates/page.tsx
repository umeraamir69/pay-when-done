import Link from "next/link";
import type { Metadata } from "next";
import { JOB_TEMPLATES } from "@/lib/templates";
import { categoryLabel, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Templates" };

export default function TemplatesPage() {
  return (
    <div className="page-shell wide">
      <p className="eyebrow">Library</p>
      <h1>Job templates</h1>
      <p className="lede narrow">
        Start from a battle-tested brief. Open Create job and the same templates
        are one click away.
      </p>

      <div className="docs-grid" style={{ marginTop: "1.5rem" }}>
        {JOB_TEMPLATES.map((template) => (
          <article key={template.id} className="panel">
            <p className="eyebrow">{categoryLabel(template.category)}</p>
            <h2 style={{ fontSize: "1.25rem", margin: "0.35rem 0" }}>
              {template.title}
            </h2>
            <p className="muted">{template.audience}</p>
            <p className="brief" style={{ marginTop: "0.75rem" }}>
              {template.brief}
            </p>
            <div className="job-row-meta" style={{ marginTop: "0.85rem" }}>
              <strong>{formatMoney(template.amount)}</strong>
              <span className="status-chip">{template.priority}</span>
              {template.tags.map((tag) => (
                <span key={tag} className="status-chip">
                  {tag}
                </span>
              ))}
            </div>
            <Link
              href={`/create?template=${template.id}`}
              className="btn-primary"
              style={{ marginTop: "1rem" }}
            >
              Use template
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
