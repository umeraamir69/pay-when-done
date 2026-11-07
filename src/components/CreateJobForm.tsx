"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import type { JobCategory, JobPriority } from "@/lib/types";
import { JOB_TEMPLATES } from "@/lib/templates";

function CreateJobFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial =
    JOB_TEMPLATES.find((t) => t.id === searchParams.get("template")) ||
    JOB_TEMPLATES[0];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(initial.title);
  const [brief, setBrief] = useState(initial.brief);
  const [amount, setAmount] = useState(String(initial.amount));
  const [category, setCategory] = useState<JobCategory>(initial.category);
  const [priority, setPriority] = useState<JobPriority>(initial.priority);
  const [tags, setTags] = useState(initial.tags.join(", "));
  const [autoPayoutOnRelease, setAutoPayoutOnRelease] = useState(true);
  const [createInvoiceOnFund, setCreateInvoiceOnFund] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(initial.id);

  useEffect(() => {
    const id = searchParams.get("template");
    if (id) applyTemplate(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function applyTemplate(id: string) {
    const t = JOB_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setActiveTemplate(id);
    setTitle(t.title);
    setBrief(t.brief);
    setAmount(String(t.amount));
    setCategory(t.category);
    setPriority(t.priority);
    setTags(t.tags.join(", "));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      title,
      brief,
      amount: Number(amount),
      category,
      priority,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      autoPayoutOnRelease,
      createInvoiceOnFund,
      clientName: String(form.get("clientName") || ""),
      workerName: String(form.get("workerName") || ""),
      workerEmail: String(form.get("workerEmail") || ""),
      currency: "USD",
    };

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create job");
      router.push(`/jobs/${data.job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form className="panel-form" onSubmit={onSubmit}>
      <div className="template-row">
        <span className="field-label">Quick templates</span>
        <div className="chip-row">
          {JOB_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip ${activeTemplate === t.id ? "active" : ""}`}
              onClick={() => applyTemplate(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <label>
        Job title
        <input
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label>
        Brief (what “done” means)
        <textarea
          name="brief"
          required
          rows={5}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
        />
      </label>

      <div className="form-row">
        <label>
          Escrow amount (USD)
          <input
            name="amount"
            type="number"
            min="1"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as JobCategory)}
          >
            <option value="cleaning">Cleaning</option>
            <option value="moving">Moving</option>
            <option value="tutoring">Tutoring</option>
            <option value="handyman">Handyman</option>
            <option value="creative">Creative</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>

      <div className="form-row">
        <label>
          Priority
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as JobPriority)}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </label>
        <label>
          Tags (comma-separated)
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="same-day, residential"
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Your name (client)
          <input name="clientName" required defaultValue="Alex Rivera" />
        </label>
        <label>
          Worker name
          <input name="workerName" required defaultValue="Jordan Lee" />
        </label>
      </div>

      <label>
        Worker email
        <input
          name="workerEmail"
          type="email"
          required
          defaultValue="jordan@example.com"
        />
      </label>

      <div className="toggle-row">
        <label className="check-label">
          <input
            type="checkbox"
            checked={autoPayoutOnRelease}
            onChange={(e) => setAutoPayoutOnRelease(e.target.checked)}
          />
          Auto PayPal payout to worker on release
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={createInvoiceOnFund}
            onChange={(e) => setCreateInvoiceOnFund(e.target.checked)}
          />
          Create PayPal invoice when funds are held
        </label>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Creating…" : "Create escrow job"}
      </button>
    </form>
  );
}

export function CreateJobForm() {
  return (
    <Suspense fallback={<p className="muted">Loading form…</p>}>
      <CreateJobFormInner />
    </Suspense>
  );
}
