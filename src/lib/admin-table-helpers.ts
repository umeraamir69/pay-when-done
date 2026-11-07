import type {
  InvoiceRecord,
  Job,
  JobCategory,
  JobStatus,
  LedgerEntry,
  PayoutRecord,
  WebhookEvent,
} from "@/lib/types";
import { categoryLabel, statusLabel } from "@/lib/format";

export const STATUS_FILTERS: Array<JobStatus | "all"> = [
  "all",
  "awaiting_payment",
  "funded",
  "proof_submitted",
  "ai_approved",
  "ai_rejected",
  "disputed",
  "released",
  "refunded",
  "voided",
];

export const CATEGORY_FILTERS: Array<JobCategory | "all"> = [
  "all",
  "cleaning",
  "moving",
  "tutoring",
  "handyman",
  "creative",
  "other",
];

export const LEDGER_TYPES = [
  "all",
  "authorize",
  "capture",
  "void",
  "refund",
  "invoice",
  "payout",
  "sync",
  "webhook",
] as const;

export function jobSearch(job: Job, q: string) {
  return [job.title, job.clientName, job.workerName, job.workerEmail, ...job.tags]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function jobSortValue(job: Job, key: string) {
  switch (key) {
    case "title":
      return job.title;
    case "parties":
      return `${job.clientName} ${job.workerName}`;
    case "category":
      return job.category;
    case "amount":
      return job.amount;
    case "status":
      return job.status;
    case "updatedAt":
      return job.updatedAt;
    default:
      return null;
  }
}

export function ledgerSearch(row: LedgerEntry, q: string) {
  return [row.type, row.jobTitle, row.status, row.paypalId || "", String(row.amount)]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function ledgerSortValue(row: LedgerEntry, key: string) {
  switch (key) {
    case "at":
      return row.at;
    case "type":
      return row.type;
    case "jobTitle":
      return row.jobTitle;
    case "amount":
      return row.amount;
    case "paypalId":
      return row.paypalId || "";
    case "status":
      return row.status;
    default:
      return null;
  }
}

export function invoiceSearch(row: InvoiceRecord, q: string) {
  return [
    row.paypalInvoiceId,
    row.status,
    row.recipientEmail,
    row.jobId,
    String(row.amount),
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function invoiceSortValue(row: InvoiceRecord, key: string) {
  switch (key) {
    case "createdAt":
      return row.createdAt;
    case "paypalInvoiceId":
      return row.paypalInvoiceId;
    case "recipientEmail":
      return row.recipientEmail;
    case "amount":
      return row.amount;
    case "status":
      return row.status;
    case "jobId":
      return row.jobId;
    default:
      return null;
  }
}

export function payoutSearch(row: PayoutRecord, q: string) {
  return [
    row.batchId,
    row.itemId || "",
    row.status,
    row.receiver,
    row.jobId,
    String(row.amount),
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function payoutSortValue(row: PayoutRecord, key: string) {
  switch (key) {
    case "createdAt":
      return row.createdAt;
    case "batchId":
      return row.batchId;
    case "receiver":
      return row.receiver;
    case "amount":
      return row.amount;
    case "status":
      return row.status;
    case "jobId":
      return row.jobId;
    default:
      return null;
  }
}

export function webhookSearch(row: WebhookEvent, q: string) {
  return [
    row.eventType,
    row.resourceId || "",
    row.jobId || "",
    row.processed ? "processed" : "pending",
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function webhookSortValue(row: WebhookEvent, key: string) {
  switch (key) {
    case "receivedAt":
      return row.receivedAt;
    case "eventType":
      return row.eventType;
    case "resourceId":
      return row.resourceId || "";
    case "jobId":
      return row.jobId || "";
    case "processed":
      return row.processed ? 1 : 0;
    default:
      return null;
  }
}

export function statusOptionLabel(value: JobStatus | "all") {
  return value === "all" ? "All statuses" : statusLabel(value);
}

export function categoryOptionLabel(value: JobCategory | "all") {
  return value === "all" ? "All categories" : categoryLabel(value);
}
