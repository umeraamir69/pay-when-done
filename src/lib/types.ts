export type JobStatus =
  | "draft"
  | "awaiting_payment"
  | "funded"
  | "proof_submitted"
  | "ai_approved"
  | "ai_rejected"
  | "disputed"
  | "released"
  | "refunded"
  | "voided";

export type JobCategory =
  | "cleaning"
  | "moving"
  | "tutoring"
  | "handyman"
  | "creative"
  | "other";

export type JobPriority = "low" | "normal" | "high";

export type ActorRole = "client" | "worker" | "admin" | "system" | "ai" | "paypal";

export type AiVerdict = {
  approved: boolean;
  confidence: number;
  summary: string;
  matchedRequirements: string[];
  missingRequirements: string[];
  checkedAt: string;
  provider: "muse" | "mock";
};

export type ActivityEvent = {
  id: string;
  at: string;
  actor: ActorRole;
  actorName?: string;
  type: string;
  message: string;
};

export type DisputeMessage = {
  id: string;
  at: string;
  author: ActorRole;
  authorName: string;
  body: string;
};

export type Milestone = {
  id: string;
  title: string;
  amount: number;
  status: "pending" | "funded" | "completed" | "paid";
  dueAt?: string;
};

export type PayPalSnapshot = {
  orderId?: string;
  orderStatus?: string;
  authorizationId?: string;
  authorizationStatus?: string;
  captureId?: string;
  captureStatus?: string;
  invoiceId?: string;
  invoiceStatus?: string;
  payoutBatchId?: string;
  payoutItemId?: string;
  payoutStatus?: string;
  refundId?: string;
  refundStatus?: string;
  raw?: unknown;
  syncedAt?: string;
  /** Set by prisma/seed.mjs so release/void can mock without live PayPal. */
  source?: string;
};

export type Job = {
  id: string;
  title: string;
  brief: string;
  amount: number;
  currency: string;
  category: JobCategory;
  priority: JobPriority;
  tags: string[];
  clientName: string;
  workerName: string;
  workerEmail: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  dueAt?: string;
  paypalOrderId?: string;
  paypalAuthorizationId?: string;
  paypalCaptureId?: string;
  paypalInvoiceId?: string;
  paypalPayoutBatchId?: string;
  paypalRefundId?: string;
  paypal?: PayPalSnapshot;
  proofImageDataUrl?: string;
  proofNotes?: string;
  aiVerdict?: AiVerdict;
  activity: ActivityEvent[];
  disputes: DisputeMessage[];
  milestones: Milestone[];
  workerRating?: number;
  internalNotes?: string;
  autoPayoutOnRelease?: boolean;
  createInvoiceOnFund?: boolean;
  ownerId?: string;
};

export type CreateJobInput = {
  title: string;
  brief: string;
  amount: number;
  currency?: string;
  category?: JobCategory;
  priority?: JobPriority;
  tags?: string[];
  clientName: string;
  workerName: string;
  workerEmail: string;
  dueAt?: string;
  autoPayoutOnRelease?: boolean;
  createInvoiceOnFund?: boolean;
};

export type LedgerEntry = {
  id: string;
  at: string;
  jobId: string;
  jobTitle: string;
  type:
    | "authorize"
    | "capture"
    | "void"
    | "refund"
    | "invoice"
    | "payout"
    | "sync"
    | "webhook";
  amount: number;
  currency: string;
  paypalId?: string;
  status: string;
  mock: boolean;
  meta?: Record<string, unknown>;
};

export type InvoiceRecord = {
  id: string;
  jobId: string;
  paypalInvoiceId: string;
  status: string;
  amount: number;
  currency: string;
  recipientEmail: string;
  createdAt: string;
  mock: boolean;
  detail?: unknown;
};

export type PayoutRecord = {
  id: string;
  jobId: string;
  batchId: string;
  itemId?: string;
  status: string;
  amount: number;
  currency: string;
  receiver: string;
  createdAt: string;
  mock: boolean;
  detail?: unknown;
};

export type WebhookEvent = {
  id: string;
  receivedAt: string;
  eventType: string;
  resourceId?: string;
  jobId?: string;
  payload: unknown;
  processed: boolean;
};

export type DashboardStats = {
  totalJobs: number;
  activeEscrows: number;
  fundsHeld: number;
  fundsReleased: number;
  fundsRefunded: number;
  aiApproved: number;
  aiRejected: number;
  disputed: number;
  invoicesSent: number;
  payoutsSent: number;
  avgConfidence: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  recentActivity: Array<ActivityEvent & { jobId: string; jobTitle: string }>;
  recentLedger: LedgerEntry[];
};
