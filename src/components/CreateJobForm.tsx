"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FormEvent,
  Suspense,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { JobCategory, JobPriority } from "@/lib/types";
import {
  JOB_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getTemplateById,
  searchTemplates,
} from "@/lib/templates";
import { categoryLabel, formatMoney, priorityLabel } from "@/lib/format";
import { withTopProgress } from "@/lib/top-progress";
import { BusySpinner } from "@/components/TableControls";
import {
  IconBriefcase,
  IconLayout,
  IconPayout,
  IconShield,
  IconUser,
} from "@/components/NavIcons";

type StepId = "template" | "details" | "people" | "payment" | "review";

const STEPS: Array<{
  id: StepId;
  label: string;
  title: string;
  lede: string;
  Icon: typeof IconLayout;
}> = [
  {
    id: "template",
    label: "Template",
    title: "Start from a template",
    lede: "Pick a proven brief, or continue blank and write your own.",
    Icon: IconLayout,
  },
  {
    id: "details",
    label: "Details",
    title: "Define the job",
    lede: "Title, acceptance criteria, escrow amount, and classification.",
    Icon: IconBriefcase,
  },
  {
    id: "people",
    label: "People",
    title: "Who’s involved",
    lede: "Client and worker details used on the escrow record.",
    Icon: IconUser,
  },
  {
    id: "payment",
    label: "Payment",
    title: "PayPal options",
    lede: "Choose how payout and invoicing behave after funds are held.",
    Icon: IconPayout,
  },
  {
    id: "review",
    label: "Review",
    title: "Confirm and create",
    lede: "Check everything once. You’ll authorize PayPal on the next screen.",
    Icon: IconShield,
  },
];

type CategoryFilter = JobCategory | "all";

function CreateJobFormInner() {
  const searchParams = useSearchParams();
  const templateParam = searchParams.get("template");
  return (
    <CreateJobFormWizard
      key={templateParam || "default"}
      templateParam={templateParam}
    />
  );
}

function CreateJobFormWizard({
  templateParam,
}: {
  templateParam: string | null;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const initial = getTemplateById(templateParam) || JOB_TEMPLATES[0];

  const [stepIndex, setStepIndex] = useState(() =>
    getTemplateById(templateParam) ? 1 : 0,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial.title);
  const [brief, setBrief] = useState(initial.brief);
  const [amount, setAmount] = useState(String(initial.amount));
  const [category, setCategory] = useState<JobCategory>(initial.category);
  const [priority, setPriority] = useState<JobPriority>(initial.priority);
  const [tags, setTags] = useState(initial.tags.join(", "));
  const [clientName, setClientName] = useState("Alex Rivera");
  const [workerName, setWorkerName] = useState("Jordan Lee");
  const [workerEmail, setWorkerEmail] = useState("jordan@example.com");
  const [autoPayoutOnRelease, setAutoPayoutOnRelease] = useState(true);
  const [createInvoiceOnFund, setCreateInvoiceOnFund] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(
    initial.id,
  );

  const [templateQuery, setTemplateQuery] = useState("");
  const [templateCategory, setTemplateCategory] =
    useState<CategoryFilter>("all");
  const deferredQuery = useDeferredValue(templateQuery);

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  const filteredTemplates = useMemo(
    () => searchTemplates(deferredQuery, templateCategory),
    [deferredQuery, templateCategory],
  );


  function applyTemplate(id: string) {
    const t = getTemplateById(id);
    if (!t) return;
    setActiveTemplate(id);
    setTitle(t.title);
    setBrief(t.brief);
    setAmount(String(t.amount));
    setCategory(t.category);
    setPriority(t.priority);
    setTags(t.tags.join(", "));
    setFieldError(null);
  }

  function startBlank() {
    setActiveTemplate(null);
    setTitle("");
    setBrief("");
    setAmount("");
    setCategory("other");
    setPriority("normal");
    setTags("");
    setFieldError(null);
  }

  function validateStep(index: number): string | null {
    const id = STEPS[index].id;
    if (id === "details") {
      if (!title.trim()) return "Add a job title.";
      if (!brief.trim()) return "Describe what “done” means.";
      const n = Number(amount);
      if (!amount.trim() || Number.isNaN(n) || n <= 0) {
        return "Enter an escrow amount greater than 0.";
      }
    }
    if (id === "people") {
      if (!clientName.trim()) return "Enter the client name.";
      if (!workerName.trim()) return "Enter the worker name.";
      if (!workerEmail.trim()) return "Enter the worker email.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workerEmail.trim())) {
        return "Enter a valid worker email.";
      }
    }
    return null;
  }

  function goNext() {
    const msg = validateStep(stepIndex);
    if (msg) {
      setFieldError(msg);
      return;
    }
    setFieldError(null);
    setError(null);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function goBack() {
    setFieldError(null);
    setError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function goToStep(index: number) {
    if (index === stepIndex) return;
    if (index < stepIndex) {
      setFieldError(null);
      setError(null);
      setStepIndex(index);
      return;
    }
    for (let i = stepIndex; i < index; i++) {
      const msg = validateStep(i);
      if (msg) {
        setFieldError(msg);
        setStepIndex(i);
        return;
      }
    }
    setFieldError(null);
    setError(null);
    setStepIndex(index);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isLast) {
      goNext();
      return;
    }

    for (let i = 0; i < STEPS.length - 1; i++) {
      const msg = validateStep(i);
      if (msg) {
        setFieldError(msg);
        setStepIndex(i);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setFieldError(null);

    const payload = {
      title: title.trim(),
      brief: brief.trim(),
      amount: Number(amount),
      category,
      priority,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      autoPayoutOnRelease,
      createInvoiceOnFund,
      clientName: clientName.trim(),
      workerName: workerName.trim(),
      workerEmail: workerEmail.trim(),
      currency: "USD",
    };

    try {
      await withTopProgress(async () => {
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create job");
        router.push(`/jobs/${data.job.id}`);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const amountPreview = Number(amount);
  const tagsList = tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <form className="panel-form create-wizard" onSubmit={onSubmit} noValidate>
      <nav className="create-wizard-progress" aria-label="Create job steps">
        <ol>
          {STEPS.map((s, i) => {
            const done = i < stepIndex;
            const current = i === stepIndex;
            return (
              <li
                key={s.id}
                className={[
                  done ? "done" : "",
                  current ? "current" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <button
                  type="button"
                  className="create-wizard-step-btn"
                  onClick={() => goToStep(i)}
                  aria-current={current ? "step" : undefined}
                >
                  <span className="create-wizard-step-index" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="create-wizard-step-label">
                    <s.Icon size={14} />
                    {s.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div
          className="create-wizard-bar"
          role="presentation"
          style={{
            ["--wizard-progress" as string]: `${(stepIndex / (STEPS.length - 1)) * 100}%`,
          }}
        />
      </nav>

      <motion.div
        key={step.id}
        className="create-wizard-pane"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.15 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="create-wizard-pane-head">
          <p className="eyebrow">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
          <h2>{step.title}</h2>
          <p className="muted create-wizard-lede">{step.lede}</p>
        </header>

        {step.id === "template" ? (
          <div className="create-template-step">
            <div className="create-template-toolbar">
              <label className="create-template-search">
                <span className="sr-only">Search templates</span>
                <input
                  type="search"
                  value={templateQuery}
                  onChange={(e) => setTemplateQuery(e.target.value)}
                  placeholder="Search templates…"
                  autoComplete="off"
                />
              </label>
              <Link href="/templates" className="template-browse-link">
                Browse library
              </Link>
            </div>

            <div
              className="create-template-filters"
              role="tablist"
              aria-label="Template categories"
            >
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={templateCategory === cat}
                  className={`chip ${templateCategory === cat ? "active" : ""}`}
                  onClick={() => setTemplateCategory(cat)}
                >
                  {cat === "all" ? "All" : categoryLabel(cat)}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={`create-template-blank ${activeTemplate === null ? "active" : ""}`}
              onClick={startBlank}
            >
              <strong>Start blank</strong>
              <span className="muted">Write your own title and brief</span>
            </button>

            {activeTemplate ? (
              <p className="create-template-selected muted">
                Selected:{" "}
                <strong>
                  {getTemplateById(activeTemplate)?.label || activeTemplate}
                </strong>
                <span> · Continue when ready, or pick another.</span>
              </p>
            ) : (
              <p className="create-template-selected muted">
                Blank job selected. Continue to write the brief yourself.
              </p>
            )}

            <div className="create-template-grid" role="listbox" aria-label="Templates">
              {filteredTemplates.length === 0 ? (
                <p className="muted create-template-empty">
                  No templates match. Try another keyword or category.
                </p>
              ) : (
                filteredTemplates.map((t) => {
                  const selected = activeTemplate === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`create-template-option ${selected ? "active" : ""}`}
                      onClick={() => applyTemplate(t.id)}
                      onDoubleClick={() => {
                        applyTemplate(t.id);
                        setFieldError(null);
                        setError(null);
                        setStepIndex(1);
                      }}
                    >
                      <span className="create-template-option-top">
                        <span className="eyebrow">{categoryLabel(t.category)}</span>
                        <strong>{formatMoney(t.amount)}</strong>
                      </span>
                      <span className="create-template-option-title">{t.label}</span>
                      <span className="muted create-template-option-brief">
                        {t.title}
                      </span>
                      <span className="muted create-template-option-audience">
                        {t.audience}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}

        {step.id === "details" ? (
          <div className="create-step-fields">
            <label>
              Job title
              <input
                name="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoComplete="off"
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
          </div>
        ) : null}

        {step.id === "people" ? (
          <div className="create-step-fields">
            <div className="form-row">
              <label>
                Your name (client)
                <input
                  name="clientName"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  autoComplete="name"
                />
              </label>
              <label>
                Worker name
                <input
                  name="workerName"
                  required
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  autoComplete="off"
                />
              </label>
            </div>

            <label>
              Worker email
              <input
                name="workerEmail"
                type="email"
                required
                value={workerEmail}
                onChange={(e) => setWorkerEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
          </div>
        ) : null}

        {step.id === "payment" ? (
          <div className="create-step-fields">
            <div className="toggle-row create-payment-toggles">
              <label className="check-label create-check-card">
                <input
                  type="checkbox"
                  checked={autoPayoutOnRelease}
                  onChange={(e) => setAutoPayoutOnRelease(e.target.checked)}
                />
                <span>
                  <strong>Auto PayPal payout to worker on release</strong>
                  <span className="muted">
                    Send funds to the worker automatically when you release escrow.
                  </span>
                </span>
              </label>
              <label className="check-label create-check-card">
                <input
                  type="checkbox"
                  checked={createInvoiceOnFund}
                  onChange={(e) => setCreateInvoiceOnFund(e.target.checked)}
                />
                <span>
                  <strong>Create PayPal invoice when funds are held</strong>
                  <span className="muted">
                    Generate an invoice record once escrow is funded.
                  </span>
                </span>
              </label>
            </div>
          </div>
        ) : null}

        {step.id === "review" ? (
          <div className="create-review">
            <div className="create-review-edits" aria-label="Jump back to edit">
              <button type="button" className="btn-ghost" onClick={() => goToStep(0)}>
                Edit template
              </button>
              <button type="button" className="btn-ghost" onClick={() => goToStep(1)}>
                Edit details
              </button>
              <button type="button" className="btn-ghost" onClick={() => goToStep(2)}>
                Edit people
              </button>
              <button type="button" className="btn-ghost" onClick={() => goToStep(3)}>
                Edit payment
              </button>
            </div>
            <dl className="create-review-grid">
              <div>
                <dt>Template</dt>
                <dd>
                  {activeTemplate
                    ? getTemplateById(activeTemplate)?.label || activeTemplate
                    : "Blank"}
                </dd>
              </div>
              <div>
                <dt>Title</dt>
                <dd>{title.trim() || "—"}</dd>
              </div>
              <div className="create-review-span">
                <dt>Brief</dt>
                <dd className="create-review-brief">{brief.trim() || "—"}</dd>
              </div>
              <div>
                <dt>Escrow</dt>
                <dd>
                  {Number.isFinite(amountPreview) && amountPreview > 0
                    ? formatMoney(amountPreview)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{categoryLabel(category)}</dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd>{priorityLabel(priority)}</dd>
              </div>
              <div>
                <dt>Tags</dt>
                <dd>{tagsList.length ? tagsList.join(", ") : "—"}</dd>
              </div>
              <div>
                <dt>Client</dt>
                <dd>{clientName.trim() || "—"}</dd>
              </div>
              <div>
                <dt>Worker</dt>
                <dd>
                  {workerName.trim() || "—"}
                  {workerEmail.trim() ? (
                    <span className="muted"> · {workerEmail.trim()}</span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt>Auto payout</dt>
                <dd>{autoPayoutOnRelease ? "On" : "Off"}</dd>
              </div>
              <div>
                <dt>Invoice on fund</dt>
                <dd>{createInvoiceOnFund ? "On" : "Off"}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </motion.div>

      {fieldError ? <p className="error">{fieldError}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="create-wizard-actions">
        {!isFirst ? (
          <button
            type="button"
            className="btn-ghost"
            onClick={goBack}
            disabled={loading}
          >
            Back
          </button>
        ) : (
          <span />
        )}
        {isLast ? (
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <BusySpinner label="Creating…" /> : "Create escrow job"}
          </button>
        ) : (
          <button type="submit" className="btn-primary">
            Continue
          </button>
        )}
      </div>
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
