import { prisma } from "./prisma";
import {
  invoiceFromDb,
  jobCreateData,
  jobFromDb,
  ledgerFromDb,
  payoutFromDb,
  webhookFromDb,
} from "./mappers";
import type {
  ActivityEvent,
  ActorRole,
  CreateJobInput,
  DashboardStats,
  DisputeMessage,
  InvoiceRecord,
  Job,
  JobStatus,
  LedgerEntry,
  Milestone,
  PayPalSnapshot,
  PayoutRecord,
  WebhookEvent,
} from "./types";

function makeActivity(
  actor: ActorRole,
  type: string,
  message: string,
  actorName?: string,
): ActivityEvent {
  return {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor,
    actorName,
    type,
    message,
  };
}

export async function listJobs(): Promise<Job[]> {
  const rows = await prisma.job.findMany({ orderBy: { updatedAt: "desc" } });
  return rows.map(jobFromDb);
}

export async function getJob(id: string): Promise<Job | null> {
  const row = await prisma.job.findUnique({ where: { id } });
  return row ? jobFromDb(row) : null;
}

export async function createJob(
  input: CreateJobInput,
  ownerId?: string,
): Promise<Job> {
  const row = await prisma.job.create({
    data: jobCreateData(input, ownerId),
  });
  return jobFromDb(row);
}

export async function updateJob(
  id: string,
  patch: Partial<Job> & { status?: JobStatus; clearAiVerdict?: boolean },
  activity?: {
    actor: ActorRole;
    type: string;
    message: string;
    actorName?: string;
  },
): Promise<Job | null> {
  const current = await getJob(id);
  if (!current) return null;

  const nextActivity = activity
    ? [
        ...current.activity,
        makeActivity(
          activity.actor,
          activity.type,
          activity.message,
          activity.actorName,
        ),
      ]
    : patch.activity || current.activity;

  const { clearAiVerdict, ...rest } = patch;
  const merged: Job = {
    ...current,
    ...rest,
    id: current.id,
    createdAt: current.createdAt,
    activity: nextActivity,
    disputes: patch.disputes ?? current.disputes,
    milestones: patch.milestones ?? current.milestones,
    updatedAt: new Date().toISOString(),
  };

  if (clearAiVerdict) delete merged.aiVerdict;

  const row = await prisma.job.update({
    where: { id },
    data: {
      title: merged.title,
      brief: merged.brief,
      amount: merged.amount,
      currency: merged.currency,
      category: merged.category,
      priority: merged.priority,
      tagsJson: JSON.stringify(merged.tags),
      clientName: merged.clientName,
      workerName: merged.workerName,
      workerEmail: merged.workerEmail,
      status: merged.status,
      dueAt: merged.dueAt ? new Date(merged.dueAt) : null,
      paypalOrderId: merged.paypalOrderId || null,
      paypalAuthorizationId: merged.paypalAuthorizationId || null,
      paypalCaptureId: merged.paypalCaptureId || null,
      paypalInvoiceId: merged.paypalInvoiceId || null,
      paypalPayoutBatchId: merged.paypalPayoutBatchId || null,
      paypalRefundId: merged.paypalRefundId || null,
      paypalJson: merged.paypal ? JSON.stringify(merged.paypal) : null,
      proofImageDataUrl: merged.proofImageDataUrl || null,
      proofNotes: merged.proofNotes || null,
      aiVerdictJson: merged.aiVerdict ? JSON.stringify(merged.aiVerdict) : null,
      activityJson: JSON.stringify(merged.activity),
      disputesJson: JSON.stringify(merged.disputes),
      milestonesJson: JSON.stringify(merged.milestones),
      workerRating: merged.workerRating ?? null,
      internalNotes: merged.internalNotes || "",
      autoPayoutOnRelease: merged.autoPayoutOnRelease ?? true,
      createInvoiceOnFund: merged.createInvoiceOnFund ?? false,
    },
  });

  return jobFromDb(row);
}

export async function recordLedger(
  entry: Omit<LedgerEntry, "id" | "at">,
): Promise<LedgerEntry> {
  const row = await prisma.ledgerEntry.create({
    data: {
      jobId: entry.jobId,
      jobTitle: entry.jobTitle,
      type: entry.type,
      amount: entry.amount,
      currency: entry.currency,
      paypalId: entry.paypalId,
      status: entry.status,
      mock: entry.mock,
      metaJson: entry.meta ? JSON.stringify(entry.meta) : null,
    },
  });
  return ledgerFromDb(row);
}

export async function recordInvoice(invoice: InvoiceRecord) {
  await prisma.invoiceRecord.create({
    data: {
      id: invoice.id,
      jobId: invoice.jobId,
      paypalInvoiceId: invoice.paypalInvoiceId,
      status: invoice.status,
      amount: invoice.amount,
      currency: invoice.currency,
      recipientEmail: invoice.recipientEmail,
      mock: invoice.mock,
      detailJson: invoice.detail ? JSON.stringify(invoice.detail) : null,
      createdAt: new Date(invoice.createdAt),
    },
  });
}

export async function recordPayout(payout: PayoutRecord) {
  await prisma.payoutRecord.create({
    data: {
      id: payout.id,
      jobId: payout.jobId,
      batchId: payout.batchId,
      itemId: payout.itemId,
      status: payout.status,
      amount: payout.amount,
      currency: payout.currency,
      receiver: payout.receiver,
      mock: payout.mock,
      detailJson: payout.detail ? JSON.stringify(payout.detail) : null,
      createdAt: new Date(payout.createdAt),
    },
  });
}

export async function recordWebhook(event: WebhookEvent) {
  await prisma.webhookEvent.create({
    data: {
      id: event.id,
      eventType: event.eventType,
      resourceId: event.resourceId,
      jobId: event.jobId,
      payloadJson: JSON.stringify(event.payload),
      processed: event.processed,
      receivedAt: new Date(event.receivedAt),
    },
  });
}

export async function listLedger() {
  const rows = await prisma.ledgerEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map(ledgerFromDb);
}

export async function listInvoices() {
  const rows = await prisma.invoiceRecord.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(invoiceFromDb);
}

export async function listPayouts() {
  const rows = await prisma.payoutRecord.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(payoutFromDb);
}

export async function listWebhooks() {
  const rows = await prisma.webhookEvent.findMany({
    orderBy: { receivedAt: "desc" },
    take: 100,
  });
  return rows.map(webhookFromDb);
}

export async function appendDispute(
  id: string,
  message: Omit<DisputeMessage, "id" | "at">,
): Promise<Job | null> {
  const job = await getJob(id);
  if (!job) return null;
  const entry: DisputeMessage = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    ...message,
  };
  return updateJob(
    id,
    {
      disputes: [...job.disputes, entry],
      status:
        job.status === "released" ||
        job.status === "voided" ||
        job.status === "refunded"
          ? job.status
          : "disputed",
    },
    {
      actor: message.author,
      actorName: message.authorName,
      type: "dispute_message",
      message: `Dispute note: ${message.body.slice(0, 80)}`,
    },
  );
}

export async function upsertMilestones(
  id: string,
  milestones: Milestone[],
): Promise<Job | null> {
  return updateJob(
    id,
    { milestones },
    {
      actor: "admin",
      type: "milestones_updated",
      message: `Milestones updated (${milestones.length})`,
    },
  );
}

export async function attachPayPalSnapshot(
  id: string,
  snapshot: PayPalSnapshot,
): Promise<Job | null> {
  const job = await getJob(id);
  if (!job) return null;
  return updateJob(id, {
    paypal: { ...job.paypal, ...snapshot, syncedAt: new Date().toISOString() },
  });
}

export async function getStats(): Promise<DashboardStats> {
  const jobs = await listJobs();
  const [invoices, payouts, ledger] = await Promise.all([
    listInvoices(),
    listPayouts(),
    listLedger(),
  ]);

  const byStatus: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  let fundsHeld = 0;
  let fundsReleased = 0;
  let fundsRefunded = 0;
  let confidenceSum = 0;
  let confidenceCount = 0;
  let aiApproved = 0;
  let aiRejected = 0;
  let disputed = 0;

  const heldStatuses = new Set([
    "funded",
    "proof_submitted",
    "ai_approved",
    "ai_rejected",
    "disputed",
  ]);

  for (const job of jobs) {
    byStatus[job.status] = (byStatus[job.status] || 0) + 1;
    byCategory[job.category] = (byCategory[job.category] || 0) + 1;
    if (heldStatuses.has(job.status)) fundsHeld += job.amount;
    if (job.status === "released") fundsReleased += job.amount;
    if (job.status === "refunded") fundsRefunded += job.amount;
    if (job.status === "disputed") disputed += 1;
    if (job.aiVerdict) {
      confidenceSum += job.aiVerdict.confidence;
      confidenceCount += 1;
      if (job.aiVerdict.approved) aiApproved += 1;
      else aiRejected += 1;
    }
  }

  const recentActivity = jobs
    .flatMap((job) =>
      job.activity.map((event) => ({
        ...event,
        jobId: job.id,
        jobTitle: job.title,
      })),
    )
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 12);

  return {
    totalJobs: jobs.length,
    activeEscrows: jobs.filter((j) => heldStatuses.has(j.status)).length,
    fundsHeld,
    fundsReleased,
    fundsRefunded,
    aiApproved,
    aiRejected,
    disputed,
    invoicesSent: invoices.length,
    payoutsSent: payouts.length,
    avgConfidence: confidenceCount ? confidenceSum / confidenceCount : 0,
    byStatus,
    byCategory,
    recentActivity,
    recentLedger: ledger.slice(0, 10),
  };
}

export async function seedDemoJobs(ownerId?: string): Promise<Job[]> {
  // Same dataset as `npm run db:seed` / `db:seed:demo` (prisma/seed.mjs).
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);

  await execFileAsync(process.execPath, ["prisma/seed.mjs"], {
    cwd: process.cwd(),
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });

  let resolvedOwnerId = ownerId;
  if (!resolvedOwnerId) {
    const admin = await prisma.user.findUnique({
      where: { email: "umer@umer.com" },
      select: { id: true },
    });
    resolvedOwnerId = admin?.id;
  }

  if (resolvedOwnerId) {
    await prisma.job.updateMany({
      where: { internalNotes: { startsWith: "[pitch-seed]" } },
      data: { ownerId: resolvedOwnerId },
    });
  }

  return listJobs();
}
