/**
 * Pitch demo seed — admin user + ≥10 realistic rows for Jobs / admin tables.
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
  if (!existsSync(full)) return;
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
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const prisma = new PrismaClient();

const ADMIN_EMAIL = "umer@umer.com";
const ADMIN_PASSWORD = "umer123123";
const ADMIN_NAME = "Umer Admin";
const SEED_NOTE = "[pitch-seed]";
const SEED_PREFIX = "SEED-";
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
      id: `${SEED_PREFIX}act-${i + 1}-${e.type}`,
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
      id: `${SEED_PREFIX}ms-${i + 1}`,
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
      id: `${SEED_PREFIX}disp-${i + 1}`,
      at: (d.at || hoursAgo(i + 2)).toISOString(),
      author: d.author,
      authorName: d.authorName,
      body: d.body,
    })),
  );
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
  await prisma.webhookEvent.deleteMany({
    where: { resourceId: { startsWith: SEED_PREFIX } },
  });
  // Orphan mock rows from older partial seeds
  await prisma.ledgerEntry.deleteMany({
    where: { paypalId: { startsWith: SEED_PREFIX } },
  });
  await prisma.invoiceRecord.deleteMany({
    where: { paypalInvoiceId: { startsWith: SEED_PREFIX } },
  });
  await prisma.payoutRecord.deleteMany({
    where: { batchId: { startsWith: SEED_PREFIX } },
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

  const jobSpecs = [
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
      workerEmail: "jordan.lee@example.com",
      status: "funded",
      dueAt: daysFromNow(1),
      createdAt: daysAgo(2),
      paypalOrderId: `${SEED_PREFIX}ORDER-01`,
      paypalAuthorizationId: `${SEED_PREFIX}AUTH-01`,
      paypalInvoiceId: `${SEED_PREFIX}INV-01`,
      autoPayoutOnRelease: true,
      createInvoiceOnFund: true,
      milestonesJson: milestones([
        { title: "Bathrooms cleaned", amount: 60, status: "funded" },
        { title: "Grout refresh photos", amount: 25, status: "pending" },
      ]),
      activityJson: activity([
        { actor: "client", type: "created", message: "Job posted", actorName: "Alex Rivera" },
        { actor: "paypal", type: "funds_held", message: "PayPal authorization held $85" },
        { actor: "paypal", type: "invoice_sent", message: "Invoice sent to client" },
      ]),
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
      workerEmail: "chris.patel@example.com",
      status: "ai_approved",
      dueAt: daysFromNow(3),
      createdAt: daysAgo(4),
      paypalOrderId: `${SEED_PREFIX}ORDER-02`,
      paypalAuthorizationId: `${SEED_PREFIX}AUTH-02`,
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
        { actor: "worker", type: "proof_submitted", message: "Proof uploaded", actorName: "Chris Patel" },
        { actor: "ai", type: "ai_approved", message: "AI approved proof (86%)" },
      ]),
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
      workerEmail: "maya.chen@example.com",
      status: "released",
      createdAt: daysAgo(12),
      paypalOrderId: `${SEED_PREFIX}ORDER-03`,
      paypalAuthorizationId: `${SEED_PREFIX}AUTH-03`,
      paypalCaptureId: `${SEED_PREFIX}CAP-03`,
      paypalPayoutBatchId: `${SEED_PREFIX}PAYOUT-03`,
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
        { actor: "ai", type: "ai_approved", message: "AI approved tutoring proof" },
        { actor: "paypal", type: "captured", message: "Funds captured $65" },
        { actor: "paypal", type: "payout_sent", message: "Payout sent to Maya Chen" },
      ]),
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
      workerEmail: "lee.nguyen@example.com",
      status: "disputed",
      createdAt: daysAgo(6),
      paypalOrderId: `${SEED_PREFIX}ORDER-04`,
      paypalAuthorizationId: `${SEED_PREFIX}AUTH-04`,
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
        { actor: "client", type: "dispute_opened", message: "Client opened a dispute" },
      ]),
    },
    {
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
      paypalOrderId: `${SEED_PREFIX}ORDER-05`,
      paypalAuthorizationId: `${SEED_PREFIX}AUTH-05`,
      proofNotes: "Three concepts uploaded with rationale PDF.",
      activityJson: activity([
        { actor: "worker", type: "proof_submitted", message: "Design proof submitted" },
      ]),
    },
    {
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
        { actor: "client", type: "created", message: "Awaiting escrow funding" },
      ]),
    },
    {
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
      paypalOrderId: `${SEED_PREFIX}ORDER-07`,
      paypalAuthorizationId: `${SEED_PREFIX}AUTH-07`,
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
        { actor: "ai", type: "ai_rejected", message: "AI rejected proof — missing cable photos" },
      ]),
    },
    {
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
      paypalOrderId: `${SEED_PREFIX}ORDER-08`,
      paypalAuthorizationId: `${SEED_PREFIX}AUTH-08`,
      paypalCaptureId: `${SEED_PREFIX}CAP-08`,
      paypalRefundId: `${SEED_PREFIX}REF-08`,
      activityJson: activity([
        { actor: "client", type: "cancelled", message: "Client cancelled — refund issued" },
        { actor: "paypal", type: "refunded", message: "Refund completed $180" },
      ]),
    },
    {
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
      paypalOrderId: `${SEED_PREFIX}ORDER-09`,
      paypalAuthorizationId: `${SEED_PREFIX}AUTH-09`,
      paypalInvoiceId: `${SEED_PREFIX}INV-09`,
      milestonesJson: milestones([
        { title: "Session 1 + annotated draft", amount: 75, status: "funded" },
        { title: "Session 2 + final polish", amount: 75, status: "pending", dueAt: daysFromNow(10) },
      ]),
      activityJson: activity([
        { actor: "paypal", type: "funds_held", message: "Authorization held $150" },
      ]),
    },
    {
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
      paypalOrderId: `${SEED_PREFIX}ORDER-10`,
      paypalAuthorizationId: `${SEED_PREFIX}AUTH-10`,
      paypalCaptureId: `${SEED_PREFIX}CAP-10`,
      paypalPayoutBatchId: `${SEED_PREFIX}PAYOUT-10`,
      workerRating: 4,
      activityJson: activity([
        { actor: "paypal", type: "payout_sent", message: "Payout sent $200" },
      ]),
    },
    {
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
      paypalOrderId: `${SEED_PREFIX}ORDER-11`,
      paypalAuthorizationId: `${SEED_PREFIX}AUTH-11`,
      activityJson: activity([
        { actor: "admin", type: "voided", message: "Authorization voided — worker no-show", actorName: ADMIN_NAME },
      ]),
    },
    {
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
        { actor: "client", type: "draft_saved", message: "Draft saved — not yet published" },
      ]),
    },
  ];

  const jobs = [];
  for (let i = 0; i < jobSpecs.length; i++) {
    const spec = jobSpecs[i];
    const {
      tags,
      createdAt,
      activityJson,
      milestonesJson,
      disputesJson,
      aiVerdictJson,
      proofNotes,
      proofImageDataUrl,
      ...rest
    } = spec;

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
        internalNotes: `${SEED_NOTE} demo job ${String(i + 1).padStart(2, "0")}`,
        ownerId,
        createdAt: createdAt || daysAgo(i + 1),
        updatedAt: hoursAgo(i),
        paypalJson: rest.paypalOrderId
          ? JSON.stringify({
              orderId: rest.paypalOrderId,
              authorizationId: rest.paypalAuthorizationId,
              captureId: rest.paypalCaptureId,
              invoiceId: rest.paypalInvoiceId,
              payoutBatchId: rest.paypalPayoutBatchId,
              refundId: rest.paypalRefundId,
              syncedAt: hoursAgo(i).toISOString(),
              mock: true,
            })
          : null,
      },
    });
    jobs.push(job);
  }

  const byTitle = Object.fromEntries(jobs.map((j) => [j.title, j]));

  const ledgerRows = [
    {
      job: byTitle["Bathroom deep clean + grout"],
      type: "authorize",
      amount: 85,
      paypalId: `${SEED_PREFIX}AUTH-01`,
      status: "CREATED",
      at: daysAgo(2),
    },
    {
      job: byTitle["Bathroom deep clean + grout"],
      type: "invoice",
      amount: 85,
      paypalId: `${SEED_PREFIX}INV-01`,
      status: "SENT",
      at: daysAgo(2),
    },
    {
      job: byTitle["Studio move — 2 hours"],
      type: "authorize",
      amount: 140,
      paypalId: `${SEED_PREFIX}AUTH-02`,
      status: "CREATED",
      at: daysAgo(4),
    },
    {
      job: byTitle["SAT math tutoring — 90 min"],
      type: "authorize",
      amount: 65,
      paypalId: `${SEED_PREFIX}AUTH-03`,
      status: "CREATED",
      at: daysAgo(12),
    },
    {
      job: byTitle["SAT math tutoring — 90 min"],
      type: "capture",
      amount: 65,
      paypalId: `${SEED_PREFIX}CAP-03`,
      status: "COMPLETED",
      at: daysAgo(10),
    },
    {
      job: byTitle["SAT math tutoring — 90 min"],
      type: "payout",
      amount: 65,
      paypalId: `${SEED_PREFIX}PAYOUT-03`,
      status: "SUCCESS",
      at: daysAgo(10),
    },
    {
      job: byTitle["Deck railing repair"],
      type: "authorize",
      amount: 220,
      paypalId: `${SEED_PREFIX}AUTH-04`,
      status: "CREATED",
      at: daysAgo(6),
    },
    {
      job: byTitle["Brand logo refresh — 3 concepts"],
      type: "authorize",
      amount: 350,
      paypalId: `${SEED_PREFIX}AUTH-05`,
      status: "CREATED",
      at: daysAgo(3),
    },
    {
      job: byTitle["Office desk assembly + cable tidy"],
      type: "authorize",
      amount: 120,
      paypalId: `${SEED_PREFIX}AUTH-07`,
      status: "CREATED",
      at: daysAgo(5),
    },
    {
      job: byTitle["Local move — sofa + dresser"],
      type: "authorize",
      amount: 180,
      paypalId: `${SEED_PREFIX}AUTH-08`,
      status: "CREATED",
      at: daysAgo(18),
    },
    {
      job: byTitle["Local move — sofa + dresser"],
      type: "capture",
      amount: 180,
      paypalId: `${SEED_PREFIX}CAP-08`,
      status: "COMPLETED",
      at: daysAgo(17),
    },
    {
      job: byTitle["Local move — sofa + dresser"],
      type: "refund",
      amount: 180,
      paypalId: `${SEED_PREFIX}REF-08`,
      status: "COMPLETED",
      at: daysAgo(16),
    },
    {
      job: byTitle["College essay coaching — 2 sessions"],
      type: "authorize",
      amount: 150,
      paypalId: `${SEED_PREFIX}AUTH-09`,
      status: "CREATED",
      at: daysAgo(2),
    },
    {
      job: byTitle["Product photo retouch — 12 images"],
      type: "capture",
      amount: 200,
      paypalId: `${SEED_PREFIX}CAP-10`,
      status: "COMPLETED",
      at: daysAgo(19),
    },
    {
      job: byTitle["Product photo retouch — 12 images"],
      type: "payout",
      amount: 200,
      paypalId: `${SEED_PREFIX}PAYOUT-10`,
      status: "SUCCESS",
      at: daysAgo(19),
    },
    {
      job: byTitle["Garage organization half-day"],
      type: "void",
      amount: 160,
      paypalId: `${SEED_PREFIX}AUTH-11`,
      status: "VOIDED",
      at: daysAgo(8),
    },
  ];

  for (const row of ledgerRows) {
    await prisma.ledgerEntry.create({
      data: {
        jobId: row.job.id,
        jobTitle: row.job.title,
        type: row.type,
        amount: row.amount,
        currency: "USD",
        paypalId: row.paypalId,
        status: row.status,
        mock: true,
        metaJson: JSON.stringify({ seed: true, source: "pitch-seed" }),
        createdAt: row.at,
      },
    });
  }

  const invoiceRows = [
    { job: byTitle["Bathroom deep clean + grout"], id: `${SEED_PREFIX}INV-01`, status: "SENT", email: "alex.rivera@example.com", at: daysAgo(2) },
    { job: byTitle["Studio move — 2 hours"], id: `${SEED_PREFIX}INV-02`, status: "PAID", email: "sam.okonkwo@example.com", at: daysAgo(4) },
    { job: byTitle["SAT math tutoring — 90 min"], id: `${SEED_PREFIX}INV-03`, status: "PAID", email: "priya.shah@example.com", at: daysAgo(12) },
    { job: byTitle["Deck railing repair"], id: `${SEED_PREFIX}INV-04`, status: "SENT", email: "morgan.ellis@example.com", at: daysAgo(6) },
    { job: byTitle["Brand logo refresh — 3 concepts"], id: `${SEED_PREFIX}INV-05`, status: "SENT", email: "taylor.brooks@example.com", at: daysAgo(3) },
    { job: byTitle["Apartment kitchen deep clean"], id: `${SEED_PREFIX}INV-06`, status: "DRAFT", email: "casey.nguyen@example.com", at: daysAgo(1) },
    { job: byTitle["Office desk assembly + cable tidy"], id: `${SEED_PREFIX}INV-07`, status: "SENT", email: "jamie.ortiz@example.com", at: daysAgo(5) },
    { job: byTitle["Local move — sofa + dresser"], id: `${SEED_PREFIX}INV-08`, status: "REFUNDED", email: "riley.kim@example.com", at: daysAgo(18) },
    { job: byTitle["College essay coaching — 2 sessions"], id: `${SEED_PREFIX}INV-09`, status: "SENT", email: "devon.park@example.com", at: daysAgo(2) },
    { job: byTitle["Product photo retouch — 12 images"], id: `${SEED_PREFIX}INV-10`, status: "PAID", email: "harper.diaz@example.com", at: daysAgo(20) },
    { job: byTitle["Garage organization half-day"], id: `${SEED_PREFIX}INV-11`, status: "CANCELLED", email: "alex.rivera@example.com", at: daysAgo(9) },
    { job: byTitle["Window wash — storefront"], id: `${SEED_PREFIX}INV-12`, status: "DRAFT", email: "sam.okonkwo@example.com", at: hoursAgo(6) },
  ];

  for (const row of invoiceRows) {
    await prisma.invoiceRecord.create({
      data: {
        jobId: row.job.id,
        paypalInvoiceId: row.id,
        status: row.status,
        amount: row.job.amount,
        currency: "USD",
        recipientEmail: row.email,
        mock: true,
        detailJson: JSON.stringify({ seed: true, note: "Pitch demo invoice" }),
        createdAt: row.at,
      },
    });
  }

  const payoutRows = [
    { job: byTitle["SAT math tutoring — 90 min"], batch: `${SEED_PREFIX}PAYOUT-03`, status: "SUCCESS", receiver: "maya.chen@example.com", at: daysAgo(10) },
    { job: byTitle["Product photo retouch — 12 images"], batch: `${SEED_PREFIX}PAYOUT-10`, status: "SUCCESS", receiver: "avery.soto@example.com", at: daysAgo(19) },
    { job: byTitle["Bathroom deep clean + grout"], batch: `${SEED_PREFIX}PAYOUT-01`, status: "PENDING", receiver: "jordan.lee@example.com", at: daysAgo(1) },
    { job: byTitle["Studio move — 2 hours"], batch: `${SEED_PREFIX}PAYOUT-02`, status: "UNCLAIMED", receiver: "chris.patel@example.com", at: hoursAgo(8) },
    { job: byTitle["Deck railing repair"], batch: `${SEED_PREFIX}PAYOUT-04`, status: "ONHOLD", receiver: "lee.nguyen@example.com", at: hoursAgo(12) },
    { job: byTitle["Brand logo refresh — 3 concepts"], batch: `${SEED_PREFIX}PAYOUT-05`, status: "PENDING", receiver: "avery.soto@example.com", at: hoursAgo(4) },
    { job: byTitle["College essay coaching — 2 sessions"], batch: `${SEED_PREFIX}PAYOUT-09`, status: "PENDING", receiver: "maya.chen@example.com", at: hoursAgo(2) },
    { job: byTitle["Office desk assembly + cable tidy"], batch: `${SEED_PREFIX}PAYOUT-07`, status: "FAILED", receiver: "lee.nguyen@example.com", at: daysAgo(4) },
    { job: byTitle["Local move — sofa + dresser"], batch: `${SEED_PREFIX}PAYOUT-08`, status: "RETURNED", receiver: "chris.patel@example.com", at: daysAgo(16) },
    { job: byTitle["Garage organization half-day"], batch: `${SEED_PREFIX}PAYOUT-11`, status: "DENIED", receiver: "lee.nguyen@example.com", at: daysAgo(8) },
    { job: byTitle["Window wash — storefront"], batch: `${SEED_PREFIX}PAYOUT-12`, status: "PENDING", receiver: "jordan.lee@example.com", at: hoursAgo(1) },
    { job: byTitle["Apartment kitchen deep clean"], batch: `${SEED_PREFIX}PAYOUT-06`, status: "PENDING", receiver: "jordan.lee@example.com", at: hoursAgo(3) },
  ];

  for (let i = 0; i < payoutRows.length; i++) {
    const row = payoutRows[i];
    await prisma.payoutRecord.create({
      data: {
        jobId: row.job.id,
        batchId: row.batch,
        itemId: `${SEED_PREFIX}PITEM-${String(i + 1).padStart(2, "0")}`,
        status: row.status,
        amount: row.job.amount,
        currency: "USD",
        receiver: row.receiver,
        mock: true,
        detailJson: JSON.stringify({ seed: true, batch_status: row.status }),
        createdAt: row.at,
      },
    });
  }

  const webhookSpecs = [
    { type: "PAYMENT.AUTHORIZATION.CREATED", resourceId: `${SEED_PREFIX}AUTH-01`, job: byTitle["Bathroom deep clean + grout"], processed: true, at: daysAgo(2) },
    { type: "INVOICING.INVOICE.SENT", resourceId: `${SEED_PREFIX}INV-01`, job: byTitle["Bathroom deep clean + grout"], processed: true, at: daysAgo(2) },
    { type: "PAYMENT.CAPTURE.COMPLETED", resourceId: `${SEED_PREFIX}CAP-03`, job: byTitle["SAT math tutoring — 90 min"], processed: true, at: daysAgo(10) },
    { type: "PAYMENT.PAYOUTS-ITEM.SUCCESS", resourceId: `${SEED_PREFIX}PAYOUT-03`, job: byTitle["SAT math tutoring — 90 min"], processed: true, at: daysAgo(10) },
    { type: "CUSTOMER.DISPUTE.CREATED", resourceId: `${SEED_PREFIX}DISP-04`, job: byTitle["Deck railing repair"], processed: true, at: hoursAgo(30) },
    { type: "PAYMENT.AUTHORIZATION.CREATED", resourceId: `${SEED_PREFIX}AUTH-05`, job: byTitle["Brand logo refresh — 3 concepts"], processed: true, at: daysAgo(3) },
    { type: "PAYMENT.CAPTURE.REFUNDED", resourceId: `${SEED_PREFIX}REF-08`, job: byTitle["Local move — sofa + dresser"], processed: true, at: daysAgo(16) },
    { type: "PAYMENT.AUTHORIZATION.VOIDED", resourceId: `${SEED_PREFIX}AUTH-11`, job: byTitle["Garage organization half-day"], processed: true, at: daysAgo(8) },
    { type: "PAYMENT.PAYOUTS-ITEM.FAILED", resourceId: `${SEED_PREFIX}PAYOUT-07`, job: byTitle["Office desk assembly + cable tidy"], processed: false, at: daysAgo(4) },
    { type: "PAYMENT.AUTHORIZATION.CREATED", resourceId: `${SEED_PREFIX}AUTH-09`, job: byTitle["College essay coaching — 2 sessions"], processed: true, at: daysAgo(2) },
    { type: "PAYMENT.CAPTURE.COMPLETED", resourceId: `${SEED_PREFIX}CAP-10`, job: byTitle["Product photo retouch — 12 images"], processed: true, at: daysAgo(19) },
    { type: "CHECKOUT.ORDER.APPROVED", resourceId: `${SEED_PREFIX}ORDER-02`, job: byTitle["Studio move — 2 hours"], processed: false, at: hoursAgo(6) },
  ];

  for (const wh of webhookSpecs) {
    await prisma.webhookEvent.create({
      data: {
        eventType: wh.type,
        resourceId: wh.resourceId,
        jobId: wh.job.id,
        processed: wh.processed,
        receivedAt: wh.at,
        payloadJson: JSON.stringify({
          id: `${SEED_PREFIX}EVT-${wh.resourceId}`,
          event_type: wh.type,
          resource: { id: wh.resourceId },
          seed: true,
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

  console.log(`Seeded admin user: ${ADMIN_EMAIL} (id=${admin.id})`);
  console.log(`Seeded party users: ${parties.length}`);
  console.log("Per-table counts:");
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table}: ${count}`);
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
