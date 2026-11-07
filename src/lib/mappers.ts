import type { Job as DbJob, LedgerEntry as DbLedger } from "@prisma/client";
import type {
  ActivityEvent,
  AiVerdict,
  CreateJobInput,
  DisputeMessage,
  InvoiceRecord,
  Job,
  LedgerEntry,
  Milestone,
  PayPalSnapshot,
  PayoutRecord,
  WebhookEvent,
} from "./types";

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function jobFromDb(row: DbJob): Job {
  return {
    id: row.id,
    title: row.title,
    brief: row.brief,
    amount: row.amount,
    currency: row.currency,
    category: row.category as Job["category"],
    priority: row.priority as Job["priority"],
    tags: parseJson<string[]>(row.tagsJson, []),
    clientName: row.clientName,
    workerName: row.workerName,
    workerEmail: row.workerEmail,
    status: row.status as Job["status"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    dueAt: row.dueAt?.toISOString(),
    paypalOrderId: row.paypalOrderId || undefined,
    paypalAuthorizationId: row.paypalAuthorizationId || undefined,
    paypalCaptureId: row.paypalCaptureId || undefined,
    paypalInvoiceId: row.paypalInvoiceId || undefined,
    paypalPayoutBatchId: row.paypalPayoutBatchId || undefined,
    paypalRefundId: row.paypalRefundId || undefined,
    paypal: parseJson<PayPalSnapshot | undefined>(row.paypalJson, undefined),
    proofImageDataUrl: row.proofImageDataUrl || undefined,
    proofNotes: row.proofNotes || undefined,
    aiVerdict: parseJson<AiVerdict | undefined>(row.aiVerdictJson, undefined),
    activity: parseJson<ActivityEvent[]>(row.activityJson, []),
    disputes: parseJson<DisputeMessage[]>(row.disputesJson, []),
    milestones: parseJson<Milestone[]>(row.milestonesJson, []),
    workerRating: row.workerRating ?? undefined,
    internalNotes: row.internalNotes || "",
    autoPayoutOnRelease: row.autoPayoutOnRelease,
    createInvoiceOnFund: row.createInvoiceOnFund,
    ownerId: row.ownerId || undefined,
  };
}

export function jobCreateData(input: CreateJobInput, ownerId?: string) {
  const nowActivity = [
    {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      actor: "client" as const,
      actorName: input.clientName.trim(),
      type: "job_created",
      message: `Escrow job created for ${input.workerName}`,
    },
  ];

  return {
    title: input.title.trim(),
    brief: input.brief.trim(),
    amount: Number(input.amount),
    currency: (input.currency || "USD").toUpperCase(),
    category: input.category || "other",
    priority: input.priority || "normal",
    tagsJson: JSON.stringify(input.tags || []),
    clientName: input.clientName.trim(),
    workerName: input.workerName.trim(),
    workerEmail: input.workerEmail.trim().toLowerCase(),
    status: "awaiting_payment",
    dueAt: input.dueAt ? new Date(input.dueAt) : null,
    autoPayoutOnRelease: input.autoPayoutOnRelease ?? true,
    createInvoiceOnFund: input.createInvoiceOnFund ?? false,
    activityJson: JSON.stringify(nowActivity),
    disputesJson: "[]",
    milestonesJson: "[]",
    ownerId: ownerId || null,
  };
}

export function ledgerFromDb(row: DbLedger): LedgerEntry {
  return {
    id: row.id,
    at: row.createdAt.toISOString(),
    jobId: row.jobId,
    jobTitle: row.jobTitle,
    type: row.type as LedgerEntry["type"],
    amount: row.amount,
    currency: row.currency,
    paypalId: row.paypalId || undefined,
    status: row.status,
    mock: row.mock,
    meta: parseJson(row.metaJson, undefined),
  };
}

export function invoiceFromDb(row: {
  id: string;
  jobId: string;
  paypalInvoiceId: string;
  status: string;
  amount: number;
  currency: string;
  recipientEmail: string;
  mock: boolean;
  detailJson: string | null;
  createdAt: Date;
}): InvoiceRecord {
  return {
    id: row.id,
    jobId: row.jobId,
    paypalInvoiceId: row.paypalInvoiceId,
    status: row.status,
    amount: row.amount,
    currency: row.currency,
    recipientEmail: row.recipientEmail,
    createdAt: row.createdAt.toISOString(),
    mock: row.mock,
    detail: parseJson(row.detailJson, undefined),
  };
}

export function payoutFromDb(row: {
  id: string;
  jobId: string;
  batchId: string;
  itemId: string | null;
  status: string;
  amount: number;
  currency: string;
  receiver: string;
  mock: boolean;
  detailJson: string | null;
  createdAt: Date;
}): PayoutRecord {
  return {
    id: row.id,
    jobId: row.jobId,
    batchId: row.batchId,
    itemId: row.itemId || undefined,
    status: row.status,
    amount: row.amount,
    currency: row.currency,
    receiver: row.receiver,
    createdAt: row.createdAt.toISOString(),
    mock: row.mock,
    detail: parseJson(row.detailJson, undefined),
  };
}

export function webhookFromDb(row: {
  id: string;
  eventType: string;
  resourceId: string | null;
  jobId: string | null;
  payloadJson: string;
  processed: boolean;
  receivedAt: Date;
}): WebhookEvent {
  return {
    id: row.id,
    receivedAt: row.receivedAt.toISOString(),
    eventType: row.eventType,
    resourceId: row.resourceId || undefined,
    jobId: row.jobId || undefined,
    payload: parseJson(row.payloadJson, {}),
    processed: row.processed,
  };
}
