"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { GeneratedTemplate } from "@/lib/templates";
import { categoryLabel, formatMoney } from "@/lib/format";
import { saveTemplateDraft, toTemplateDraft } from "@/lib/template-draft";
import { BusySpinner } from "@/components/TableControls";
import { FadeIn } from "@/components/Motion";

const EXAMPLES = [
  "Deep clean a 1BR apartment before move-in, including fridge and oven",
  "Help load a U-Haul from a 2nd-floor walk-up this Saturday",
  "90-minute SAT reading tutoring with homework assigned after",
];

export function AskAiTemplate() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedTemplate | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = prompt.trim();
    if (text.length < 8) {
      setError("Describe the gig in a sentence or two.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Generation failed.");
      }
      setResult(data.template as GeneratedTemplate);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  function persistDraft() {
    if (!result) return;
    saveTemplateDraft(toTemplateDraft(result));
  }

  return (
    <FadeIn className="ask-ai-template panel">
      <div className="ask-ai-template-head">
        <div>
          <p className="eyebrow">Ask AI</p>
          <h2>Make a template from a description</h2>
          <p className="muted">
            Describe the gig in plain language. Muse drafts a title, brief,
            category, suggested amount, and tags you can use right away.
          </p>
        </div>
      </div>

      <form className="ask-ai-form" onSubmit={onSubmit}>
        <label className="ask-ai-label">
          <span className="sr-only">Describe the job</span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the job…"
            rows={3}
            maxLength={2000}
            disabled={loading}
          />
        </label>
        <div className="ask-ai-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <BusySpinner label="Generating…" /> : "Generate template"}
          </button>
          {result ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setResult(null);
                setError(null);
              }}
            >
              Clear preview
            </button>
          ) : null}
        </div>
      </form>

      {!result && !error ? (
        <div className="ask-ai-examples">
          <p className="muted">Try one:</p>
          <div className="ask-ai-example-row">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                className="chip"
                onClick={() => setPrompt(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="error">{error}</p> : null}

      {result ? (
        <article className="ask-ai-preview">
          <div className="template-card-top">
            <p className="eyebrow">{categoryLabel(result.category)}</p>
            <strong className="template-amount">
              {formatMoney(result.amount)}
            </strong>
          </div>
          <h3>{result.title}</h3>
          {result.audience ? (
            <p className="muted template-audience">{result.audience}</p>
          ) : null}
          <p className="brief">{result.brief}</p>
          <div className="job-row-meta">
            <span className="status-chip">{result.priority}</span>
            {result.tags.map((tag) => (
              <span key={tag} className="status-chip">
                {tag}
              </span>
            ))}
            <span className="status-chip">
              {result.provider === "muse" ? "Muse" : "Offline draft"}
            </span>
          </div>
          <div className="ask-ai-preview-actions">
            <Link
              href={`/create?template=${encodeURIComponent(result.id)}`}
              className="btn-primary"
              onClick={persistDraft}
            >
              Use this template
            </Link>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setPrompt(prompt || result.title)}
            >
              Tweak description
            </button>
          </div>
        </article>
      ) : null}
    </FadeIn>
  );
}
