/**
 * Pitch demo seed — admin user + ≥10 realistic rows for Jobs / admin tables.
 *
 * PayPal IDs mimic sandbox shapes the UI displays (Orders, Auth, Capture,
 * Invoice INV2-*, Payout batch, Refund, WH-* webhook ids) — not SEED-/test junk.
 *
 * Admin: umer@umer.com (ADMIN_EMAILS allow-list).
 * Re-run safely: upserts users/accounts; replaces prior pitch-seed domain rows.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

/** Load KEY=VALUE from a dotenv file into process.env (override existing). */
function loadEnvFile(relativePath) {
  const full = resolve(process.cwd(), relativePath);
  if (!existsSync(full)) return false;
  for (const line of readFileSync(full, "utf8").split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
  return true;
}

loadEnvFile(".env");
const hasLocal = loadEnvFile(".env.local");

// Prefer Neon from .env.local — root .env may still point at a leftover SQLite path.
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("file:")) {
  console.error(
    "Seed requires a Postgres DATABASE_URL (set in .env.local). Refusing SQLite/file URL.",
  );
  process.exit(1);
}
if (!hasLocal) {
  console.warn("Warning: .env.local not found; using DATABASE_URL from .env");
}

const prisma = new PrismaClient();

const ADMIN_EMAIL = "umer@umer.com";
const ADMIN_PASSWORD = "umer123123";
const ADMIN_NAME = "Umer Admin";
const SEED_NOTE = "[pitch-seed]";
const SEED_MARKER = "pitch-seed";
const LEGACY_SEED_PREFIX = "SEED-";
const DEMO_PASSWORD = "demo123123";

const partyUsers = [
  { email: "alex.rivera@example.com", name: "Alex Rivera" },
  { email: "sam.okonkwo@example.com", name: "Sam Okonkwo" },
  { email: "priya.shah@example.com", name: "Priya Shah" },
  { email: "morgan.ellis@example.com", name: "Morgan Ellis" },
  { email: "taylor.brooks@example.com", name: "Taylor Brooks" },
  { email: "casey.nguyen@example.com", name: "Casey Nguyen" },
  { email: "jamie.ortiz@example.com", name: "Jamie Ortiz" },
  { email: "riley.kim@example.com", name: "Riley Kim" },
  { email: "devon.park@example.com", name: "Devon Park" },
  { email: "harper.diaz@example.com", name: "Harper Diaz" },
  { email: "jordan.lee@example.com", name: "Jordan Lee" },
  { email: "chris.patel@example.com", name: "Chris Patel" },
];

/**
 * Deterministic PayPal-like ID helpers (sandbox-shaped, stable across re-seeds).
 * Order / auth / capture / refund: 17-char uppercase alphanumeric.
 * Invoice: INV2-XXXX-XXXX-XXXX-XXXX
 * Payout batch / item: 13-char alphanumeric
 * Webhook event: WH-{17}-{17}
 *
 * Keep in sync with src/lib/paypal-demo-ids.ts — release/void/sync mock these
 * IDs when PAYPAL_MOCK=false so pitch demos never hit RESOURCE_NOT_FOUND.
 */
const PP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** High-bit LCG extract — low bits of classic LCGs collide across nearby seeds. */
function ppChars(seed, length) {
  let n = (seed >>> 0) ^ 0x9e3779b9;
  let out = "";
  for (let i = 0; i < length; i++) {
    n = (Math.imul(n ^ (i + 1) * 0x85ebca6b, 1664525) + 1013904223) >>> 0;
    out += PP_ALPHABET[(n >>> 16) % PP_ALPHABET.length];
  }
  return out;
}

function paypalOrderId(n) {
  return ppChars(0x10000000 + n * 7919, 17);
}

function paypalAuthId(n) {
  return ppChars(0x20000000 + n * 6151, 17);
}

function paypalCaptureId(n) {
  return ppChars(0x30000000 + n * 5281, 17);
}

function paypalRefundId(n) {
  return ppChars(0x40000000 + n * 4723, 17);
}

function paypalInvoiceId(n) {
  const a = ppChars(0x51000000 + n * 3343 + 11, 4);
  const b = ppChars(0x52000000 + n * 3343 + 29, 4);
  const c = ppChars(0x53000000 + n * 3343 + 47, 4);
  const d = ppChars(0x54000000 + n * 3343 + 61, 4);
  return `INV2-${a}-${b}-${c}-${d}`;
}

function paypalPayoutBatchId(n) {
  return ppChars(0x60000000 + n * 8191, 13);
}

function paypalPayoutItemId(n) {
  return ppChars(0x70000000 + n * 7351, 13);
}

function paypalWebhookEventId(n) {
  return `WH-${ppChars(0x80000000 + n * 9001, 17)}-${ppChars(0x81000000 + n * 11003, 17)}`;
}

function paypalDisputeId(n) {
  return `PP-D-${ppChars(0x90000000 + n * 4211, 13)}`;
}

function hoursAgo(h) {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function daysAgo(d) {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
}

function daysFromNow(d) {
  return new Date(Date.now() + d * 24 * 60 * 60 * 1000);
}

function activity(events) {
  return JSON.stringify(
    events.map((e, i) => ({
      id: `act-${e.type}-${ppChars(0x41435400 + i * 31 + (e.type?.length || 0), 8)}`,
      at: (e.at || hoursAgo(i + 1)).toISOString(),
      actor: e.actor,
      actorName: e.actorName,
      type: e.type,
      message: e.message,
    })),
  );
}

function milestones(items) {
  return JSON.stringify(
    items.map((m, i) => ({
      id: `ms-${ppChars(0x4d530000 + i * 97, 10)}`,
      title: m.title,
      amount: m.amount,
      status: m.status,
      dueAt: m.dueAt?.toISOString?.() ?? m.dueAt,
    })),
  );
}

function disputes(items) {
  return JSON.stringify(
    items.map((d, i) => ({
      id: `disp-${ppChars(0x44535010 + i * 53, 10)}`,
      at: (d.at || hoursAgo(i + 2)).toISOString(),
      author: d.author,
      authorName: d.authorName,
      body: d.body,
    })),
  );
}

function seedMeta(extra = {}) {
  return JSON.stringify({ source: SEED_MARKER, ...extra });
}

async function upsertCredentialUser({ email, name, passwordHash, verified = true }) {
  const normalized = email.toLowerCase();
  const user = await prisma.user.upsert({
    where: { email: normalized },
    create: {
      email: normalized,
      name,
      emailVerified: verified,
    },
    update: {
      name,
      emailVerified: verified,
    },
  });

  const existing = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });

  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: { password: passwordHash, accountId: user.id },
    });
  } else {
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: passwordHash,
      },
    });
  }

  return user;
}

async function clearPitchSeedDomain() {
  // Cascade removes ledger / invoices / payouts tied to pitch jobs.
  await prisma.job.deleteMany({
    where: { internalNotes: { startsWith: SEED_NOTE } },
  });

  // Webhooks: new marker + legacy SEED- resource ids from prior thin seed.
  await prisma.webhookEvent.deleteMany({
    where: {
      OR: [
        { payloadJson: { contains: `"source":"${SEED_MARKER}"` } },
        { payloadJson: { contains: '"seed":true' } },
        { resourceId: { startsWith: LEGACY_SEED_PREFIX } },
      ],
    },
  });

  // Orphan mock rows from older partial seeds
  await prisma.ledgerEntry.deleteMany({
    where: {
      OR: [
        { paypalId: { startsWith: LEGACY_SEED_PREFIX } },
        { metaJson: { contains: `"source":"${SEED_MARKER}"` } },
        { metaJson: { contains: '"seed":true' } },
      ],
    },
  });
  await prisma.invoiceRecord.deleteMany({
    where: {
      OR: [
        { paypalInvoiceId: { startsWith: LEGACY_SEED_PREFIX } },
        { detailJson: { contains: `"source":"${SEED_MARKER}"` } },
        { detailJson: { contains: '"seed":true' } },
      ],
    },
  });
  await prisma.payoutRecord.deleteMany({
    where: {
      OR: [
        { batchId: { startsWith: LEGACY_SEED_PREFIX } },
        { detailJson: { contains: `"source":"${SEED_MARKER}"` } },
        { detailJson: { contains: '"seed":true' } },
      ],
    },
  });
}

async function main() {
  const adminPasswordHash = await hashPassword(ADMIN_PASSWORD);
  const demoPasswordHash = await hashPassword(DEMO_PASSWORD);

  const admin = await upsertCredentialUser({
    email: ADMIN_EMAIL,
    name: ADMIN_NAME,
    passwordHash: adminPasswordHash,
  });

  const parties = [];
  for (const p of partyUsers) {
    parties.push(
      await upsertCredentialUser({
        email: p.email,
        name: p.name,
        passwordHash: demoPasswordHash,
      }),
    );
  }

  await clearPitchSeedDomain();

  // /api/jobs scopes by ownerId — attach pitch jobs to admin for the demo.
  const ownerId = admin.id;

  // Stable PayPal IDs per job slot (1-based index into helpers).
  const ids = Object.fromEntries(
    Array.from({ length: 14 }, (_, i) => {
      const n = i + 1;
      return [
        n,
        {
          order: paypalOrderId(n),
          auth: paypalAuthId(n),
          capture: paypalCaptureId(n),
          refund: paypalRefundId(n),
          invoice: paypalInvoiceId(n),
          payout: paypalPayoutBatchId(n),
          payoutItem: paypalPayoutItemId(n),
          webhook: paypalWebhookEventId(n),
          dispute: paypalDisputeId(n),
        },
      ];
    }),
  );

  const jobSpecs = [
    {
      n: 1,
      title: "Bathroom deep clean + grout",
      brief:
        "Clean both bathrooms. Remove soap scum from glass. Whiten floor grout. Empty trash. After photos required.",
      amount: 85,
      category: "cleaning",
      priority: "high",
      tags: ["same-day", "residential"],
      clientName: "Alex Rivera",
      workerName: "Jordan Lee",
      workerEmail: "jordan.lee@example.com",
      status: "funded",
      dueAt: daysFromNow(1),
      createdAt: daysAgo(2),
      useOrder: true,
      useAuth: true,
      useInvoice: true,
      orderStatus: "COMPLETED",
      authorizationStatus: "CREATED",
      invoiceStatus: "SENT",
      autoPayoutOnRelease: true,
      createInvoiceOnFund: true,
      milestonesJson: milestones([
        { title: "Bathrooms cleaned", amount: 60, status: "funded" },
        { title: "Grout refresh photos", amount: 25, status: "pending" },
      ]),
      activityJson: activity([
        { actor: "client", type: "created", message: "Job posted", actorName: "Alex Rivera", at: daysAgo(2) },
        { actor: "paypal", type: "funds_held", message: "PayPal authorization held $85.00 USD", at: daysAgo(2) },
        { actor: "paypal", type: "invoice_sent", message: "Invoice sent to alex.rivera@example.com", at: hoursAgo(40) },
      ]),
    },
    {
      n: 2,
      title: "Studio move — 2 hours",
      brief:
        "Load/unload studio. Protect floors. Assemble bed. Photos of empty unit and set-up bed.",
      amount: 140,
      category: "moving",
      priority: "normal",
      tags: ["weekend"],
      clientName: "Sam Okonkwo",
      workerName: "Chris Patel",
      workerEmail: "chris.patel@example.com",
      status: "ai_approved",
      dueAt: daysFromNow(3),
      createdAt: daysAgo(4),
      useOrder: true,
      useAuth: true,
      orderStatus: "COMPLETED",
      authorizationStatus: "CREATED",
      proofNotes:
        "Unit emptied, floors protected, bed assembled. Photos attached.",
      proofImageDataUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      aiVerdictJson: JSON.stringify({
        approved: true,
        confidence: 0.86,
        summary:
          "Proof notes cover load/unload, floor protection, and bed assembly.",
        matchedRequirements: ["empty unit", "bed assembled", "floor protection"],
        missingRequirements: [],
        checkedAt: hoursAgo(5).toISOString(),
        provider: "muse",
      }),
      activityJson: activity([
        { actor: "client", type: "created", message: "Job posted", actorName: "Sam Okonkwo", at: daysAgo(4) },
        { actor: "paypal", type: "funds_held", message: "PayPal authorization held $140.00 USD", at: daysAgo(4) },
        { actor: "worker", type: "proof_submitted", message: "Proof uploaded", actorName: "Chris Patel", at: hoursAgo(8) },
        { actor: "ai", type: "ai_approved", message: "AI approved proof (86%)", at: hoursAgo(5) },
      ]),
    },
    {
      n: 3,
      title: "SAT math tutoring — 90 min",
      brief:
        "90-minute SAT math session. One-page summary + 5 practice problems. Session end screenshot.",
      amount: 65,
      category: "tutoring",
      priority: "low",
      tags: ["remote"],
      clientName: "Priya Shah",
      workerName: "Maya Chen",
      workerEmail: "maya.chen@example.com",
      status: "released",
      createdAt: daysAgo(12),
      useOrder: true,
      useAuth: true,
      useCapture: true,
      usePayout: true,
      orderStatus: "COMPLETED",
      authorizationStatus: "CAPTURED",
      captureStatus: "COMPLETED",
      payoutStatus: "SUCCESS",
      workerRating: 5,
      aiVerdictJson: JSON.stringify({
        approved: true,
        confidence: 0.91,
        summary: "Summary and practice set present; session evidence accepted.",
        matchedRequirements: ["summary", "practice problems"],
        missingRequirements: [],
        checkedAt: daysAgo(10).toISOString(),
        provider: "muse",
      }),
      activityJson: activity([
        { actor: "ai", type: "ai_approved", message: "AI approved tutoring proof", at: daysAgo(10) },
        { actor: "paypal", type: "captured", message: "Funds captured $65.00 USD", at: daysAgo(10) },
        { actor: "paypal", type: "payout_sent", message: "Payout sent to Maya Chen", at: daysAgo(10) },
      ]),
    },
    {
      n: 4,
      title: "Deck railing repair",
      brief:
        "Replace loose railing posts on backyard deck. Sand and seal cut ends. Safety check photos.",
      amount: 220,
      category: "handyman",
      priority: "high",
      tags: ["urgent"],
      clientName: "Morgan Ellis",
      workerName: "Lee Nguyen",
      workerEmail: "lee.nguyen@example.com",
      status: "disputed",
      createdAt: daysAgo(6),
      useOrder: true,
      useAuth: true,
      orderStatus: "COMPLETED",
      authorizationStatus: "CREATED",
      disputesJson: disputes([
        {
          author: "client",
          authorName: "Morgan Ellis",
          body: "Railing still wobbles on the left side. Need rework before release.",
          at: hoursAgo(30),
        },
        {
          author: "worker",
          authorName: "Lee Nguyen",
          body: "Will reinforce with additional brackets this evening and re-upload proof.",
          at: hoursAgo(20),
        },
      ]),
      activityJson: activity([
        { actor: "paypal", type: "funds_held", message: "PayPal authorization held $220.00 USD", at: daysAgo(6) },
        { actor: "client", type: "dispute_opened", message: "Client opened a dispute", at: hoursAgo(30) },
      ]),
    },
    {
      n: 5,
      title: "Brand logo refresh — 3 concepts",
      brief:
        "Deliver three logo concepts as SVG + PNG. Include a short rationale for each direction.",
      amount: 350,
      category: "creative",
      priority: "normal",
      tags: ["design", "brand"],
      clientName: "Taylor Brooks",
      workerName: "Avery Soto",
      workerEmail: "avery.soto@example.com",
      status: "proof_submitted",
      dueAt: daysFromNow(5),
      createdAt: daysAgo(3),
      useOrder: true,
      useAuth: true,
      orderStatus: "COMPLETED",
      authorizationStatus: "CREATED",
      proofNotes: "Three concepts uploaded with rationale PDF.",
      activityJson: activity([
        { actor: "paypal", type: "funds_held", message: "PayPal authorization held $350.00 USD", at: daysAgo(3) },
        { actor: "worker", type: "proof_submitted", message: "Design proof submitted", at: hoursAgo(14) },
      ]),
    },
    {
      n: 6,
      title: "Apartment kitchen deep clean",
      brief:
        "Degrease cabinets, scrub stove, wipe fridge exterior, mop floors. Before/after photos.",
      amount: 95,
      category: "cleaning",
      priority: "normal",
      tags: ["residential"],
      clientName: "Casey Nguyen",
      workerName: "Jordan Lee",
      workerEmail: "jordan.lee@example.com",
      status: "awaiting_payment",
      dueAt: daysFromNow(7),
      createdAt: daysAgo(1),
      createInvoiceOnFund: true,
      activityJson: activity([
        { actor: "client", type: "created", message: "Awaiting escrow funding", at: daysAgo(1) },
      ]),
    },
    {
      n: 7,
      title: "Office desk assembly + cable tidy",
      brief:
        "Assemble standing desk, mount monitor arm, route cables neatly. Photo of finished setup.",
      amount: 120,
      category: "handyman",
      priority: "normal",
      tags: ["office"],
      clientName: "Jamie Ortiz",
      workerName: "Lee Nguyen",
      workerEmail: "lee.nguyen@example.com",
      status: "ai_rejected",
      createdAt: daysAgo(5),
      useOrder: true,
      useAuth: true,
      orderStatus: "COMPLETED",
      authorizationStatus: "CREATED",
      proofNotes: "Desk assembled; cable photos incomplete.",
      aiVerdictJson: JSON.stringify({
        approved: false,
        confidence: 0.42,
        summary: "Cable routing photos missing; monitor arm angle unclear.",
        matchedRequirements: ["desk assembled"],
        missingRequirements: ["cable tidy photos", "monitor arm proof"],
        checkedAt: hoursAgo(18).toISOString(),
        provider: "muse",
      }),
      activityJson: activity([
        { actor: "paypal", type: "funds_held", message: "PayPal authorization held $120.00 USD", at: daysAgo(5) },
        { actor: "ai", type: "ai_rejected", message: "AI rejected proof — missing cable photos", at: hoursAgo(18) },
      ]),
    },
    {
      n: 8,
      title: "Local move — sofa + dresser",
      brief:
        "Move sofa and dresser from 2nd floor walk-up to truck, then into new apartment. Protect walls.",
      amount: 180,
      category: "moving",
      priority: "high",
      tags: ["stairs", "weekend"],
      clientName: "Riley Kim",
      workerName: "Chris Patel",
      workerEmail: "chris.patel@example.com",
      status: "refunded",
      createdAt: daysAgo(18),
      useOrder: true,
      useAuth: true,
      useCapture: true,
      useRefund: true,
      orderStatus: "COMPLETED",
      authorizationStatus: "CAPTURED",
      captureStatus: "REFUNDED",
      refundStatus: "COMPLETED",
      activityJson: activity([
        { actor: "paypal", type: "captured", message: "Funds captured $180.00 USD", at: daysAgo(17) },
        { actor: "client", type: "cancelled", message: "Client cancelled — refund issued", at: daysAgo(16) },
        { actor: "paypal", type: "refunded", message: "Refund completed $180.00 USD", at: daysAgo(16) },
      ]),
    },
    {
      n: 9,
      title: "College essay coaching — 2 sessions",
      brief:
        "Two 45-minute coaching calls. Deliver annotated draft with comments after each session.",
      amount: 150,
      category: "tutoring",
      priority: "normal",
      tags: ["remote", "writing"],
      clientName: "Devon Park",
      workerName: "Maya Chen",
      workerEmail: "maya.chen@example.com",
      status: "funded",
      dueAt: daysFromNow(10),
      createdAt: daysAgo(2),
      useOrder: true,
      useAuth: true,
      useInvoice: true,
      orderStatus: "COMPLETED",
      authorizationStatus: "CREATED",
      invoiceStatus: "SENT",
      milestonesJson: milestones([
        { title: "Session 1 + annotated draft", amount: 75, status: "funded" },
        { title: "Session 2 + final polish", amount: 75, status: "pending", dueAt: daysFromNow(10) },
      ]),
      activityJson: activity([
        { actor: "paypal", type: "funds_held", message: "Authorization held $150.00 USD", at: daysAgo(2) },
      ]),
    },
    {
      n: 10,
      title: "Product photo retouch — 12 images",
      brief:
        "Color-correct and remove backgrounds on 12 SKU photos. Deliver ZIP of PNG + JPG.",
      amount: 200,
      category: "creative",
      priority: "low",
      tags: ["ecommerce"],
      clientName: "Harper Diaz",
      workerName: "Avery Soto",
      workerEmail: "avery.soto@example.com",
      status: "released",
      createdAt: daysAgo(20),
      useOrder: true,
      useAuth: true,
      useCapture: true,
      usePayout: true,
      useInvoice: true,
      orderStatus: "COMPLETED",
      authorizationStatus: "CAPTURED",
      captureStatus: "COMPLETED",
      payoutStatus: "SUCCESS",
      invoiceStatus: "PAID",
      workerRating: 4,
      activityJson: activity([
        { actor: "paypal", type: "captured", message: "Funds captured $200.00 USD", at: daysAgo(19) },
        { actor: "paypal", type: "payout_sent", message: "Payout sent $200.00 USD", at: daysAgo(19) },
      ]),
    },
    {
      n: 11,
      title: "Garage organization half-day",
      brief:
        "Sort tools, label bins, clear floor path to workbench. Before/after wide shots.",
      amount: 160,
      category: "other",
      priority: "normal",
      tags: ["weekend"],
      clientName: "Alex Rivera",
      workerName: "Lee Nguyen",
      workerEmail: "lee.nguyen@example.com",
      status: "voided",
      createdAt: daysAgo(9),
      useOrder: true,
      useAuth: true,
      orderStatus: "VOIDED",
      authorizationStatus: "VOIDED",
      activityJson: activity([
        { actor: "admin", type: "voided", message: "Authorization voided — worker no-show", actorName: ADMIN_NAME, at: daysAgo(8) },
      ]),
    },
    {
      n: 12,
      title: "Window wash — storefront",
      brief:
        "Interior and exterior storefront windows. Remove hard water spots. After photos at dusk.",
      amount: 110,
      category: "cleaning",
      priority: "high",
      tags: ["commercial", "same-day"],
      clientName: "Sam Okonkwo",
      workerName: "Jordan Lee",
      workerEmail: "jordan.lee@example.com",
      status: "draft",
      dueAt: daysFromNow(2),
      createdAt: hoursAgo(6),
      activityJson: activity([
        { actor: "client", type: "draft_saved", message: "Draft saved — not yet published", at: hoursAgo(6) },
      ]),
    },
  ];

  const jobs = [];
  for (let i = 0; i < jobSpecs.length; i++) {
    const spec = jobSpecs[i];
    const {
      n,
      tags,
      createdAt,
      activityJson,
      milestonesJson,
      disputesJson,
      aiVerdictJson,
      proofNotes,
      proofImageDataUrl,
      useOrder,
      useAuth,
      useCapture,
      useRefund,
      useInvoice,
      usePayout,
      orderStatus,
      authorizationStatus,
      captureStatus,
      refundStatus,
      invoiceStatus,
      payoutStatus,
      ...rest
    } = spec;

    const pp = ids[n];
    const paypalOrderIdVal = useOrder ? pp.order : null;
    const paypalAuthorizationId = useAuth ? pp.auth : null;
    const paypalCaptureId = useCapture ? pp.capture : null;
    const paypalRefundId = useRefund ? pp.refund : null;
    const paypalInvoiceIdVal = useInvoice ? pp.invoice : null;
    const paypalPayoutBatchId = usePayout ? pp.payout : null;

    const paypalSnapshot =
      paypalOrderIdVal || paypalAuthorizationId
        ? {
            orderId: paypalOrderIdVal || undefined,
            orderStatus: orderStatus || undefined,
            authorizationId: paypalAuthorizationId || undefined,
            authorizationStatus: authorizationStatus || undefined,
            captureId: paypalCaptureId || undefined,
            captureStatus: captureStatus || undefined,
            invoiceId: paypalInvoiceIdVal || undefined,
            invoiceStatus: invoiceStatus || undefined,
            payoutBatchId: paypalPayoutBatchId || undefined,
            payoutItemId: usePayout ? pp.payoutItem : undefined,
            payoutStatus: payoutStatus || undefined,
            refundId: paypalRefundId || undefined,
            refundStatus: refundStatus || undefined,
            syncedAt: hoursAgo(i).toISOString(),
            source: SEED_MARKER,
          }
        : null;

    const job = await prisma.job.create({
      data: {
        ...rest,
        currency: "USD",
        tagsJson: JSON.stringify(tags || []),
        activityJson: activityJson || "[]",
        milestonesJson: milestonesJson || "[]",
        disputesJson: disputesJson || "[]",
        aiVerdictJson: aiVerdictJson || null,
        proofNotes: proofNotes || null,
        proofImageDataUrl: proofImageDataUrl || null,
        paypalOrderId: paypalOrderIdVal,
        paypalAuthorizationId,
        paypalCaptureId,
        paypalRefundId,
        paypalInvoiceId: paypalInvoiceIdVal,
        paypalPayoutBatchId,
        internalNotes: `${SEED_NOTE} demo job ${String(i + 1).padStart(2, "0")}`,
        ownerId,
        createdAt: createdAt || daysAgo(i + 1),
        updatedAt: hoursAgo(i),
        paypalJson: paypalSnapshot ? JSON.stringify(paypalSnapshot) : null,
      },
    });
    jobs.push(job);
  }

  const byN = Object.fromEntries(jobs.map((j, idx) => [jobSpecs[idx].n, j]));

  const ledgerRows = [
    { n: 1, type: "authorize", amount: 85, paypalKey: "auth", status: "CREATED", at: daysAgo(2) },
    { n: 1, type: "invoice", amount: 85, paypalKey: "invoice", status: "SENT", at: daysAgo(2) },
    { n: 2, type: "authorize", amount: 140, paypalKey: "auth", status: "CREATED", at: daysAgo(4) },
    { n: 2, type: "sync", amount: 140, paypalKey: "order", status: "COMPLETED", at: hoursAgo(6) },
    { n: 3, type: "authorize", amount: 65, paypalKey: "auth", status: "CREATED", at: daysAgo(12) },
    { n: 3, type: "capture", amount: 65, paypalKey: "capture", status: "COMPLETED", at: daysAgo(10) },
    { n: 3, type: "payout", amount: 65, paypalKey: "payout", status: "SUCCESS", at: daysAgo(10) },
    { n: 4, type: "authorize", amount: 220, paypalKey: "auth", status: "CREATED", at: daysAgo(6) },
    { n: 4, type: "webhook", amount: 0, paypalKey: "dispute", status: "CUSTOMER.DISPUTE.CREATED", at: hoursAgo(30) },
    { n: 5, type: "authorize", amount: 350, paypalKey: "auth", status: "CREATED", at: daysAgo(3) },
    { n: 7, type: "authorize", amount: 120, paypalKey: "auth", status: "CREATED", at: daysAgo(5) },
    { n: 8, type: "authorize", amount: 180, paypalKey: "auth", status: "CREATED", at: daysAgo(18) },
    { n: 8, type: "capture", amount: 180, paypalKey: "capture", status: "COMPLETED", at: daysAgo(17) },
    { n: 8, type: "refund", amount: 180, paypalKey: "refund", status: "COMPLETED", at: daysAgo(16) },
    { n: 9, type: "authorize", amount: 150, paypalKey: "auth", status: "CREATED", at: daysAgo(2) },
    { n: 9, type: "invoice", amount: 150, paypalKey: "invoice", status: "SENT", at: daysAgo(2) },
    { n: 10, type: "capture", amount: 200, paypalKey: "capture", status: "COMPLETED", at: daysAgo(19) },
    { n: 10, type: "payout", amount: 200, paypalKey: "payout", status: "SUCCESS", at: daysAgo(19) },
    { n: 11, type: "void", amount: 160, paypalKey: "auth", status: "VOIDED", at: daysAgo(8) },
  ];

  for (const row of ledgerRows) {
    const job = byN[row.n];
    const pp = ids[row.n];
    await prisma.ledgerEntry.create({
      data: {
        jobId: job.id,
        jobTitle: job.title,
        type: row.type,
        amount: row.amount,
        currency: "USD",
        paypalId: pp[row.paypalKey],
        status: row.status,
        mock: true,
        metaJson: seedMeta({
          event: row.type,
          paypalStatus: row.status,
        }),
        createdAt: row.at,
      },
    });
  }

  const invoiceRows = [
    { n: 1, status: "SENT", email: "alex.rivera@example.com", at: daysAgo(2) },
    { n: 2, status: "PAID", email: "sam.okonkwo@example.com", at: daysAgo(4) },
    { n: 3, status: "PAID", email: "priya.shah@example.com", at: daysAgo(12) },
    { n: 4, status: "SENT", email: "morgan.ellis@example.com", at: daysAgo(6) },
    { n: 5, status: "SENT", email: "taylor.brooks@example.com", at: daysAgo(3) },
    { n: 6, status: "DRAFT", email: "casey.nguyen@example.com", at: daysAgo(1) },
    { n: 7, status: "SENT", email: "jamie.ortiz@example.com", at: daysAgo(5) },
    { n: 8, status: "REFUNDED", email: "riley.kim@example.com", at: daysAgo(18) },
    { n: 9, status: "SENT", email: "devon.park@example.com", at: daysAgo(2) },
    { n: 10, status: "PAID", email: "harper.diaz@example.com", at: daysAgo(20) },
    { n: 11, status: "CANCELLED", email: "alex.rivera@example.com", at: daysAgo(9) },
    { n: 12, status: "DRAFT", email: "sam.okonkwo@example.com", at: hoursAgo(6) },
  ];

  for (const row of invoiceRows) {
    const job = byN[row.n];
    const invoiceId = ids[row.n].invoice;
    await prisma.invoiceRecord.create({
      data: {
        jobId: job.id,
        paypalInvoiceId: invoiceId,
        status: row.status,
        amount: job.amount,
        currency: "USD",
        recipientEmail: row.email,
        mock: true,
        detailJson: seedMeta({
          href: `https://www.sandbox.paypal.com/invoice/p/#${invoiceId}`,
          status: row.status,
        }),
        createdAt: row.at,
      },
    });
  }

  const payoutRows = [
    { n: 3, status: "SUCCESS", receiver: "maya.chen@example.com", at: daysAgo(10) },
    { n: 10, status: "SUCCESS", receiver: "avery.soto@example.com", at: daysAgo(19) },
    { n: 1, status: "PENDING", receiver: "jordan.lee@example.com", at: daysAgo(1) },
    { n: 2, status: "UNCLAIMED", receiver: "chris.patel@example.com", at: hoursAgo(8) },
    { n: 4, status: "ONHOLD", receiver: "lee.nguyen@example.com", at: hoursAgo(12) },
    { n: 5, status: "PENDING", receiver: "avery.soto@example.com", at: hoursAgo(4) },
    { n: 9, status: "PENDING", receiver: "maya.chen@example.com", at: hoursAgo(2) },
    { n: 7, status: "FAILED", receiver: "lee.nguyen@example.com", at: daysAgo(4) },
    { n: 8, status: "RETURNED", receiver: "chris.patel@example.com", at: daysAgo(16) },
    { n: 11, status: "DENIED", receiver: "lee.nguyen@example.com", at: daysAgo(8) },
    { n: 12, status: "PENDING", receiver: "jordan.lee@example.com", at: hoursAgo(1) },
    { n: 6, status: "PENDING", receiver: "jordan.lee@example.com", at: hoursAgo(3) },
  ];

  for (const row of payoutRows) {
    const job = byN[row.n];
    const pp = ids[row.n];
    await prisma.payoutRecord.create({
      data: {
        jobId: job.id,
        batchId: pp.payout,
        itemId: pp.payoutItem,
        status: row.status,
        amount: job.amount,
        currency: "USD",
        receiver: row.receiver,
        mock: true,
        detailJson: seedMeta({
          batch_header: {
            payout_batch_id: pp.payout,
            batch_status: row.status,
            amount: { value: job.amount.toFixed(2), currency: "USD" },
          },
          items: [
            {
              payout_item_id: pp.payoutItem,
              transaction_status: row.status,
              payout_item: {
                receiver: row.receiver,
                amount: { value: job.amount.toFixed(2), currency: "USD" },
              },
            },
          ],
        }),
        createdAt: row.at,
      },
    });
  }

  // Webhook event types match PayPal names the app stores / surfaces in admin.
  const webhookSpecs = [
    { n: 1, type: "CHECKOUT.ORDER.APPROVED", resourceKey: "order", processed: true, at: daysAgo(2) },
    { n: 1, type: "PAYMENT.AUTHORIZATION.CREATED", resourceKey: "auth", processed: true, at: daysAgo(2) },
    { n: 1, type: "INVOICING.INVOICE.SENT", resourceKey: "invoice", processed: true, at: hoursAgo(40) },
    { n: 2, type: "PAYMENT.AUTHORIZATION.CREATED", resourceKey: "auth", processed: true, at: daysAgo(4) },
    { n: 2, type: "CHECKOUT.ORDER.APPROVED", resourceKey: "order", processed: false, at: hoursAgo(6) },
    { n: 3, type: "PAYMENT.CAPTURE.COMPLETED", resourceKey: "capture", processed: true, at: daysAgo(10) },
    { n: 3, type: "PAYMENT.PAYOUTS-ITEM.SUCCESS", resourceKey: "payoutItem", processed: true, at: daysAgo(10) },
    { n: 4, type: "CUSTOMER.DISPUTE.CREATED", resourceKey: "dispute", processed: true, at: hoursAgo(30) },
    { n: 5, type: "PAYMENT.AUTHORIZATION.CREATED", resourceKey: "auth", processed: true, at: daysAgo(3) },
    { n: 7, type: "PAYMENT.PAYOUTS-ITEM.FAILED", resourceKey: "payoutItem", processed: false, at: daysAgo(4) },
    { n: 8, type: "PAYMENT.CAPTURE.COMPLETED", resourceKey: "capture", processed: true, at: daysAgo(17) },
    { n: 8, type: "PAYMENT.CAPTURE.REFUNDED", resourceKey: "refund", processed: true, at: daysAgo(16) },
    { n: 9, type: "PAYMENT.AUTHORIZATION.CREATED", resourceKey: "auth", processed: true, at: daysAgo(2) },
    { n: 10, type: "PAYMENT.CAPTURE.COMPLETED", resourceKey: "capture", processed: true, at: daysAgo(19) },
    { n: 10, type: "PAYMENT.PAYOUTS-ITEM.SUCCESS", resourceKey: "payoutItem", processed: true, at: daysAgo(19) },
    { n: 11, type: "PAYMENT.AUTHORIZATION.VOIDED", resourceKey: "auth", processed: true, at: daysAgo(8) },
  ];

  for (let i = 0; i < webhookSpecs.length; i++) {
    const wh = webhookSpecs[i];
    const job = byN[wh.n];
    const pp = ids[wh.n];
    const resourceId = pp[wh.resourceKey];
    const eventId = paypalWebhookEventId(100 + i);
    await prisma.webhookEvent.create({
      data: {
        eventType: wh.type,
        resourceId,
        jobId: job.id,
        processed: wh.processed,
        receivedAt: wh.at,
        payloadJson: JSON.stringify({
          id: eventId,
          event_version: "1.0",
          create_time: wh.at.toISOString(),
          resource_type: wh.type.split(".")[0].toLowerCase(),
          event_type: wh.type,
          summary: `${wh.type} for ${resourceId}`,
          resource: {
            id: resourceId,
            status:
              wh.type.includes("VOIDED")
                ? "VOIDED"
                : wh.type.includes("REFUNDED")
                  ? "REFUNDED"
                  : wh.type.includes("COMPLETED") || wh.type.includes("SUCCESS")
                    ? "COMPLETED"
                    : wh.type.includes("CREATED") || wh.type.includes("APPROVED")
                      ? "CREATED"
                      : "PENDING",
            amount: {
              currency_code: "USD",
              value: job.amount.toFixed(2),
            },
            custom_id: job.id,
          },
          links: [
            {
              href: `https://api-m.sandbox.paypal.com/v1/notifications/webhooks-events/${eventId}`,
              rel: "self",
              method: "GET",
            },
          ],
          source: SEED_MARKER,
        }),
      },
    });
  }

  const counts = {
    User: await prisma.user.count(),
    Account: await prisma.account.count(),
    Job: await prisma.job.count(),
    LedgerEntry: await prisma.ledgerEntry.count(),
    InvoiceRecord: await prisma.invoiceRecord.count(),
    PayoutRecord: await prisma.payoutRecord.count(),
    WebhookEvent: await prisma.webhookEvent.count(),
  };

  const sampleIds = {
    order: ids[1].order,
    authorization: ids[1].auth,
    capture: ids[3].capture,
    invoice: ids[1].invoice,
    payoutBatch: ids[3].payout,
    payoutItem: ids[3].payoutItem,
    refund: ids[8].refund,
    webhookEvent: paypalWebhookEventId(100),
  };

  // Quick sanity: no leftover placeholder junk in pitch jobs.
  const junk = await prisma.job.count({
    where: {
      internalNotes: { startsWith: SEED_NOTE },
      OR: [
        { paypalOrderId: { startsWith: LEGACY_SEED_PREFIX } },
        { paypalOrderId: { startsWith: "MOCK-" } },
        { paypalOrderId: { equals: "test" } },
      ],
    },
  });

  console.log(`Seeded admin user: ${ADMIN_EMAIL} (id=${admin.id})`);
  console.log(`Seeded party users: ${parties.length}`);
  console.log(`Seeded jobs: ${jobs.length} (owned by admin for /api/jobs demo)`);
  console.log("Per-table counts:");
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table}: ${count}`);
  }
  console.log("Sample PayPal ID shapes:");
  for (const [k, v] of Object.entries(sampleIds)) {
    console.log(`  ${k}: ${v}`);
  }
  if (junk > 0) {
    console.error(`ERROR: ${junk} pitch jobs still have SEED-/MOCK-/test order IDs`);
    process.exitCode = 1;
  }
  console.log(
    "Ensure ADMIN_EMAILS includes umer@umer.com for allow-listed /admin access.",
  );
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
