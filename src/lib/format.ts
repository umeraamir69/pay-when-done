import type { JobCategory, JobPriority, JobStatus } from "./types";

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function statusLabel(status: JobStatus) {
  const map: Record<JobStatus, string> = {
    draft: "Draft",
    awaiting_payment: "Awaiting escrow",
    funded: "Funds held",
    proof_submitted: "Proof submitted",
    ai_approved: "AI approved",
    ai_rejected: "AI rejected",
    disputed: "Disputed",
    released: "Paid out",
    refunded: "Refunded",
    voided: "Voided",
  };
  return map[status];
}

export function categoryLabel(category: JobCategory) {
  const map: Record<JobCategory, string> = {
    cleaning: "Cleaning",
    moving: "Moving",
    tutoring: "Tutoring",
    handyman: "Handyman",
    creative: "Creative",
    other: "Other",
  };
  return map[category];
}

export function priorityLabel(priority: JobPriority) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}
