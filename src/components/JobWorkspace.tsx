"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ActorRole, Job } from "@/lib/types";
import {
  categoryLabel,
  formatDate,
  formatMoney,
  priorityLabel,
  statusLabel,
} from "@/lib/format";
import { PayPalFundButton } from "./PayPalFundButton";
import { PayPalPaymentsPanel } from "./PayPalPaymentsPanel";

type Props = { initialJob: Job };
type Tab = "flow" | "payments" | "disputes" | "milestones" | "activity" | "admin";

export function JobWorkspace({ initialJob }: Props) {
  const [job, setJob] = useState(initialJob);
  const [tab, setTab] = useState<Tab>("flow");
  const [notes, setNotes] = useState(job.proofNotes || "");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(
    job.proofImageDataUrl || null,
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disputeBody, setDisputeBody] = useState("");
  const [disputeAuthor, setDisputeAuthor] = useState<ActorRole>("client");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneAmount, setMilestoneAmount] = useState("");
  const [internalNotes, setInternalNotes] = useState(job.internalNotes || "");

  const steps = useMemo(
    () => [
      { key: "fund", label: "Hold funds", done: isPastFunded(job.status) },
      {
        key: "proof",
        label: "Submit proof",
        done: [
          "proof_submitted",
          "ai_approved",
          "ai_rejected",
          "disputed",
          "released",
        ].includes(job.status),
      },
      {
        key: "ai",
        label: "Muse verify",
        done: ["ai_approved", "ai_rejected", "released"].includes(job.status),
      },
      {
        key: "release",
        label: "Release / void",
        done: ["released", "voided"].includes(job.status),
      },
    ],
    [job.status],
  );

  async function onFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Upload an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function submitProof() {
    if (!imageDataUrl || !notes.trim()) {
      setError("Add a photo and notes that map to the brief.");
      return;
    }
    setBusy("proof");
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proofNotes: notes,
          proofImageDataUrl: imageDataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Proof upload failed");
      setJob(data.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Proof failed");
    } finally {
      setBusy(null);
    }
  }

  async function runVerify() {
    setBusy("verify");
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/verify`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verify failed");
      setJob(data.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verify failed");
    } finally {
      setBusy(null);
    }
  }

  async function release() {
    setBusy("release");
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/release`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Release failed");
      setJob(data.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Release failed");
    } finally {
      setBusy(null);
    }
  }

  async function voidJob() {
    setBusy("void");
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/void`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Void failed");
      setJob(data.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Void failed");
    } finally {
      setBusy(null);
    }
  }

  async function sendDispute() {
    if (!disputeBody.trim()) return;
    setBusy("dispute");
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: disputeAuthor,
          authorName:
            disputeAuthor === "client"
              ? job.clientName
              : disputeAuthor === "worker"
                ? job.workerName
                : "Admin",
          body: disputeBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dispute failed");
      setJob(data.job);
      setDisputeBody("");
      setTab("disputes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dispute failed");
    } finally {
      setBusy(null);
    }
  }

  async function addMilestone() {
    setBusy("milestone");
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: milestoneTitle,
          amount: Number(milestoneAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Milestone failed");
      setJob(data.job);
      setMilestoneTitle("");
      setMilestoneAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Milestone failed");
    } finally {
      setBusy(null);
    }
  }

  async function patchMilestone(
    milestoneId: string,
    status: "pending" | "funded" | "completed" | "paid",
  ) {
    setBusy("milestone");
    try {
      const res = await fetch(`/api/jobs/${job.id}/milestones`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setJob(data.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  async function saveNotes() {
    setBusy("notes");
    try {
      const res = await fetch(`/api/jobs/${job.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setJob(data.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function duplicateJob() {
    setBusy("duplicate");
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Duplicate failed");
      window.location.href = `/jobs/${data.job.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Duplicate failed");
      setBusy(null);
    }
  }

  async function rateWorker(rating: number) {
    setBusy("rate");
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rating failed");
      setJob(data.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rating failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="job-layout">
      <aside className="job-aside">
        <Link href="/jobs" className="aside-back">
          ← All jobs
        </Link>
        <p className="eyebrow light">Escrow job</p>
        <h1>{job.title}</h1>
        <p className="amount">{formatMoney(job.amount, job.currency)}</p>
        <p className={`status-pill status-${job.status}`}>
          {statusLabel(job.status)}
        </p>

        <div className="aside-meta-chips">
          <span>{categoryLabel(job.category)}</span>
          <span>{priorityLabel(job.priority)}</span>
        </div>

        <ol className="stepper">
          {steps.map((step) => (
            <li key={step.key} className={step.done ? "done" : ""}>
              {step.label}
            </li>
          ))}
        </ol>

        <dl className="meta">
          <div>
            <dt>Client</dt>
            <dd>{job.clientName}</dd>
          </div>
          <div>
            <dt>Worker</dt>
            <dd>
              {job.workerName}
              <span className="muted-on-dark"> · {job.workerEmail}</span>
            </dd>
          </div>
          {job.tags?.length ? (
            <div>
              <dt>Tags</dt>
              <dd>{job.tags.join(", ")}</dd>
            </div>
          ) : null}
        </dl>

        <div className="aside-links">
          <Link href="/admin" className="aside-admin-link">
            Admin dashboard →
          </Link>
          <Link href={`/receipt/${job.id}`} className="aside-admin-link">
            Public receipt →
          </Link>
          <button
            type="button"
            className="aside-admin-link"
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              padding: 0,
              cursor: "pointer",
              textAlign: "left",
            }}
            onClick={duplicateJob}
            disabled={busy === "duplicate"}
          >
            Duplicate job →
          </button>
        </div>
      </aside>

      <section className="job-main">
        <div className="tab-row">
          {(
            [
              ["flow", "Escrow flow"],
              ["payments", "PayPal"],
              ["disputes", `Disputes (${job.disputes.length})`],
              ["milestones", `Milestones (${job.milestones.length})`],
              ["activity", "Activity"],
              ["admin", "Admin"],
            ] as Array<[Tab, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`tab-btn ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {error ? <p className="error">{error}</p> : null}

        {tab === "flow" ? (
          <>
            <article className="panel">
              <h2>Acceptance brief</h2>
              <p className="brief">{job.brief}</p>
            </article>

            {job.status === "awaiting_payment" || job.status === "draft" ? (
              <article className="panel">
                <h2>1. Client holds funds</h2>
                <PayPalFundButton job={job} onFunded={setJob} />
              </article>
            ) : null}

            {["funded", "ai_rejected", "disputed"].includes(job.status) ? (
              <article className="panel">
                <h2>2. Worker submits proof</h2>
                <p className="muted">
                  Upload a photo and notes that map to the brief. Muse compares
                  evidence against acceptance criteria.
                </p>
                <label className="file-label">
                  Proof photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onFile(e.target.files?.[0] || null)}
                  />
                </label>
                {imageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageDataUrl}
                    alt="Proof preview"
                    className="proof-preview"
                  />
                ) : null}
                <label>
                  Notes for the verifier
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe what you completed…"
                  />
                </label>
                <div className="action-row">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={submitProof}
                    disabled={busy === "proof"}
                  >
                    {busy === "proof" ? "Uploading…" : "Submit proof"}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={voidJob}
                    disabled={busy === "void"}
                  >
                    Void hold
                  </button>
                </div>
              </article>
            ) : null}

            {job.status === "proof_submitted" ? (
              <article className="panel">
                <h2>3. Run Muse verification</h2>
                {job.proofImageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={job.proofImageDataUrl}
                    alt="Submitted proof"
                    className="proof-preview"
                  />
                ) : null}
                <p className="brief">{job.proofNotes}</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={runVerify}
                  disabled={busy === "verify"}
                >
                  {busy === "verify" ? "Muse is checking…" : "Verify with Muse AI"}
                </button>
              </article>
            ) : null}

            {job.aiVerdict &&
            ["ai_approved", "ai_rejected", "released", "disputed"].includes(
              job.status,
            ) ? (
              <article className="panel">
                <h2>Muse verdict</h2>
                <p
                  className={`verdict ${job.aiVerdict.approved ? "ok" : "bad"}`}
                >
                  {job.aiVerdict.approved ? "Approved" : "Rejected"} ·{" "}
                  {Math.round(job.aiVerdict.confidence * 100)}% confidence ·{" "}
                  {job.aiVerdict.provider}
                </p>
                <p>{job.aiVerdict.summary}</p>
                {job.aiVerdict.matchedRequirements.length ? (
                  <div>
                    <h3>Matched</h3>
                    <ul>
                      {job.aiVerdict.matchedRequirements.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {job.aiVerdict.missingRequirements.length ? (
                  <div>
                    <h3>Missing</h3>
                    <ul>
                      {job.aiVerdict.missingRequirements.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {job.status === "ai_approved" ? (
                  <div className="action-row">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={release}
                      disabled={busy === "release"}
                    >
                      {busy === "release"
                        ? "Capturing…"
                        : "Release PayPal payment"}
                    </button>
                  </div>
                ) : null}
              </article>
            ) : null}

            {job.status === "released" ? (
              <article className="panel success-panel">
                <h2>Payment released</h2>
                <p>
                  PayPal capture complete
                  {job.paypalCaptureId ? ` (${job.paypalCaptureId})` : ""}.
                </p>
                <div className="action-row">
                  <Link href="/create" className="btn-primary">
                    Start another job
                  </Link>
                  <Link href={`/receipt/${job.id}`} className="btn-ghost">
                    View receipt
                  </Link>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={duplicateJob}
                    disabled={busy === "duplicate"}
                  >
                    Duplicate job
                  </button>
                </div>
                <div style={{ marginTop: "1rem" }}>
                  <h3>Rate worker</h3>
                  <p className="muted">
                    Current: {job.workerRating ? `${job.workerRating}/5` : "not rated"}
                  </p>
                  <div className="chip-row">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`chip ${job.workerRating === n ? "active" : ""}`}
                        disabled={busy === "rate"}
                        onClick={() => rateWorker(n)}
                      >
                        {n}★
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            ) : null}

            {job.status === "voided" ? (
              <article className="panel">
                <h2>Hold voided</h2>
                <p className="muted">Client was not charged.</p>
              </article>
            ) : null}
          </>
        ) : null}

        {tab === "payments" ? (
          <PayPalPaymentsPanel job={job} onUpdate={setJob} />
        ) : null}

        {tab === "disputes" ? (
          <article className="panel">
            <h2>Dispute thread</h2>
            <p className="muted">
              Client, worker, or admin can leave notes. Opening a dispute marks
              the job as disputed until resolved.
            </p>
            <div className="dispute-thread">
              {job.disputes.length === 0 ? (
                <p className="muted">No dispute messages yet.</p>
              ) : (
                job.disputes.map((msg) => (
                  <div key={msg.id} className="dispute-bubble">
                    <div className="dispute-head">
                      <strong>{msg.authorName}</strong>
                      <span className="muted">
                        {msg.author} · {formatDate(msg.at)}
                      </span>
                    </div>
                    <p>{msg.body}</p>
                  </div>
                ))
              )}
            </div>
            <div className="form-row">
              <label>
                As
                <select
                  value={disputeAuthor}
                  onChange={(e) =>
                    setDisputeAuthor(e.target.value as ActorRole)
                  }
                >
                  <option value="client">Client</option>
                  <option value="worker">Worker</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </div>
            <label>
              Message
              <textarea
                rows={3}
                value={disputeBody}
                onChange={(e) => setDisputeBody(e.target.value)}
                placeholder="Describe the issue or proposed fix…"
              />
            </label>
            <button
              type="button"
              className="btn-primary"
              onClick={sendDispute}
              disabled={busy === "dispute"}
            >
              {busy === "dispute" ? "Sending…" : "Post dispute note"}
            </button>
          </article>
        ) : null}

        {tab === "milestones" ? (
          <article className="panel">
            <h2>Milestones</h2>
            <p className="muted">
              Split larger jobs into checkable payment stages.
            </p>
            {job.milestones.length === 0 ? (
              <p className="muted">No milestones yet.</p>
            ) : (
              <ul className="milestone-list">
                {job.milestones.map((m) => (
                  <li key={m.id}>
                    <div>
                      <strong>{m.title}</strong>
                      <div className="muted">
                        {formatMoney(m.amount, job.currency)} · {m.status}
                      </div>
                    </div>
                    <select
                      value={m.status}
                      onChange={(e) =>
                        patchMilestone(
                          m.id,
                          e.target.value as
                            | "pending"
                            | "funded"
                            | "completed"
                            | "paid",
                        )
                      }
                    >
                      <option value="pending">pending</option>
                      <option value="funded">funded</option>
                      <option value="completed">completed</option>
                      <option value="paid">paid</option>
                    </select>
                  </li>
                ))}
              </ul>
            )}
            <div className="form-row">
              <label>
                Title
                <input
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  placeholder="First coat painted"
                />
              </label>
              <label>
                Amount
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={milestoneAmount}
                  onChange={(e) => setMilestoneAmount(e.target.value)}
                />
              </label>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={addMilestone}
              disabled={busy === "milestone"}
            >
              Add milestone
            </button>
          </article>
        ) : null}

        {tab === "activity" ? (
          <article className="panel">
            <h2>Activity timeline</h2>
            <ul className="activity-feed">
              {[...job.activity].reverse().map((event) => (
                <li key={event.id}>
                  <strong>{event.type}</strong>
                  <span className="muted">
                    {formatDate(event.at)} · {event.actor}
                    {event.actorName ? ` (${event.actorName})` : ""}
                  </span>
                  <p>{event.message}</p>
                </li>
              ))}
            </ul>
          </article>
        ) : null}

        {tab === "admin" ? (
          <article className="panel">
            <h2>Internal notes</h2>
            <p className="muted">Ops-only notes — not shown to parties.</p>
            <textarea
              rows={5}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Risk flags, follow-ups, sandbox IDs…"
            />
            <div className="action-row">
              <button
                type="button"
                className="btn-primary"
                onClick={saveNotes}
                disabled={busy === "notes"}
              >
                {busy === "notes" ? "Saving…" : "Save notes"}
              </button>
              <Link href="/admin" className="btn-ghost">
                Admin dashboard
              </Link>
            </div>
            <dl className="settings-dl" style={{ marginTop: "1.25rem" }}>
              <div>
                <dt>PayPal order</dt>
                <dd>{job.paypalOrderId || "—"}</dd>
              </div>
              <div>
                <dt>Authorization</dt>
                <dd>{job.paypalAuthorizationId || "—"}</dd>
              </div>
              <div>
                <dt>Capture</dt>
                <dd>{job.paypalCaptureId || "—"}</dd>
              </div>
            </dl>
          </article>
        ) : null}
      </section>
    </div>
  );
}

function isPastFunded(status: Job["status"]) {
  return !["draft", "awaiting_payment"].includes(status);
}
