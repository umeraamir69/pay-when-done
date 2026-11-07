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

export async function seedDemoJobs(): Promise<Job[]> {
  await prisma.ledgerEntry.deleteMany();
  await prisma.invoiceRecord.deleteMany();
  await prisma.payoutRecord.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.job.deleteMany();

  const now = Date.now();
  const mk = (actor: ActorRole, type: string, message: string, actorName?: string) =>
    makeActivity(actor, type, message, actorName);

  const demos: CreateJobInput[] = [
    {
      title: "Bathroom deep clean + grout",
      brief:
        "Clean both bathrooms. Remove soap scum from glass. Whiten floor grout. Empty trash. After photos required.",
      amount: 85,
      category: "cleaning",
      priority: "high",
      tags: ["same-day", "residential"],
      clientName: "Alex Rivera",
      workerName: "Jordan Lee",
      workerEmail: "jordan@example.com",
      autoPayoutOnRelease: true,
      createInvoiceOnFund: true,
    },
    {
      title: "Studio move — 2 hours",
      brief:
        "Load/unload studio. Protect floors. Assemble bed. Photos of empty unit and set-up bed.",
      amount: 140,
      category: "moving",
      priority: "normal",
      tags: ["weekend"],
      clientName: "Sam Okonkwo",
      workerName: "Chris Patel",
      workerEmail: "chris@example.com",
    },
    {
      title: "SAT math tutoring — 90 min",
      brief:
        "90-minute SAT math session. One-page summary + 5 practice problems. Session end screenshot.",
      amount: 65,
      category: "tutoring",
      priority: "low",
      tags: ["remote"],
      clientName: "Priya Shah",
      workerName: "Maya Chen",
      workerEmail: "maya@example.com",
    },
    {
      title: "Deck railing repair",
      brief:
        "Replace loose railing posts on backyard deck. Sand and seal cut ends. Safety check photos.",
      amount: 220,
      category: "handyman",
      priority: "high",
      tags: ["urgent"],
      clientName: "Morgan Ellis",
      workerName: "Lee Nguyen",
      workerEmail: "lee@example.com",
    },
  ];

  const created: Job[] = [];
  for (const input of demos) {
    created.push(await createJob(input));
  }

  await updateJob(created[0].id, {
    status: "funded",
    paypalOrderId: "MOCK-ORDER-DEMO1",
    paypalAuthorizationId: "MOCK-AUTH-DEMO1",
    paypalInvoiceId: "MOCK-INV-DEMO1",
    paypal: {
      orderId: "MOCK-ORDER-DEMO1",
      authorizationId: "MOCK-AUTH-DEMO1",
      invoiceId: "MOCK-INV-DEMO1",
      invoiceStatus: "SENT",
      syncedAt: new Date().toISOString(),
    },
    milestones: [
      {
        id: crypto.randomUUID(),
        title: "Bathrooms cleaned",
        amount: 60,
        status: "funded",
      },
      {
        id: crypto.randomUUID(),
        title: "Grout refresh photos",
        amount: 25,
        status: "pending",
      },
    ],
    activity: [
      ...created[0].activity,
      mk("paypal", "funds_held", "PayPal authorization held $85"),
      mk("paypal", "invoice_sent", "Invoice sent to client"),
    ],
  });

  await updateJob(created[1].id, {
    status: "ai_approved",
    paypalOrderId: "MOCK-ORDER-DEMO2",
    paypalAuthorizationId: "MOCK-AUTH-DEMO2",
    proofNotes:
      "Unit emptied, floors protected, bed assembled. Photos attached.",
    proofImageDataUrl:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    aiVerdict: {
      approved: true,
      confidence: 0.86,
      summary:
        "Proof notes cover load/unload, floor protection, and bed assembly.",
      matchedRequirements: ["empty unit", "bed assembled", "floor protection"],
      missingRequirements: [],
      checkedAt: new Date(now - 1000 * 60 * 30).toISOString(),
      provider: "muse",
    },
  });

  await updateJob(created[2].id, {
    status: "released",
    paypalCaptureId: "MOCK-CAPTURE-DEMO3",
    paypalPayoutBatchId: "MOCK-PAYOUT-DEMO3",
    workerRating: 5,
    aiVerdict: {
      approved: true,
      confidence: 0.91,
      summary: "Summary and practice set present; session evidence accepted.",
      matchedRequirements: ["summary", "practice problems"],
      missingRequirements: [],
      checkedAt: new Date(now - 1000 * 60 * 60 * 90).toISOString(),
      provider: "muse",
    },
  });

  await updateJob(created[3].id, {
    status: "disputed",
    paypalAuthorizationId: "MOCK-AUTH-DEMO4",
    disputes: [
      {
        id: crypto.randomUUID(),
        at: new Date(now - 1000 * 60 * 50).toISOString(),
        author: "client",
        authorName: "Morgan Ellis",
        body: "Railing still wobbles on the left side. Need rework before release.",
      },
      {
        id: crypto.randomUUID(),
        at: new Date(now - 1000 * 60 * 20).toISOString(),
        author: "worker",
        authorName: "Lee Nguyen",
        body: "Will reinforce with additional brackets this evening and re-upload proof.",
      },
    ],
  });

  await recordLedger({
    jobId: created[0].id,
    jobTitle: created[0].title,
    type: "authorize",
    amount: 85,
    currency: "USD",
    paypalId: "MOCK-AUTH-DEMO1",
    status: "CREATED",
    mock: true,
  });
  await recordLedger({
    jobId: created[2].id,
    jobTitle: created[2].title,
    type: "capture",
    amount: 65,
    currency: "USD",
    paypalId: "MOCK-CAPTURE-DEMO3",
    status: "COMPLETED",
    mock: true,
  });
  await recordLedger({
    jobId: created[2].id,
    jobTitle: created[2].title,
    type: "payout",
    amount: 65,
    currency: "USD",
    paypalId: "MOCK-PAYOUT-DEMO3",
    status: "SUCCESS",
    mock: true,
  });

  await recordInvoice({
    id: crypto.randomUUID(),
    jobId: created[0].id,
    paypalInvoiceId: "MOCK-INV-DEMO1",
    status: "SENT",
    amount: 85,
    currency: "USD",
    recipientEmail: "alex@example.com",
    createdAt: new Date().toISOString(),
    mock: true,
  });

  await recordPayout({
    id: crypto.randomUUID(),
    jobId: created[2].id,
    batchId: "MOCK-PAYOUT-DEMO3",
    status: "SUCCESS",
    amount: 65,
    currency: "USD",
    receiver: "maya@example.com",
    createdAt: new Date().toISOString(),
    mock: true,
  });

  return listJobs();
}
