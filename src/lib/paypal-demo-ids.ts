/**
 * Pitch-seed PayPal IDs are sandbox-shaped (not MOCK-/SEED- prefixes) so the
 * admin/jobs UI looks real. They do not exist in PayPal — capture/void/sync
 * must mock them even when PAYPAL_MOCK=false and live sandbox keys are set.
 *
 * Algorithm MUST stay in sync with prisma/seed.mjs helpers.
 */

const PP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** High-bit LCG extract — mirrors prisma/seed.mjs `ppChars`. */
function ppChars(seed: number, length: number): string {
  let n = (seed >>> 0) ^ 0x9e3779b9;
  let out = "";
  for (let i = 0; i < length; i++) {
    n = (Math.imul(n ^ (i + 1) * 0x85ebca6b, 1664525) + 1013904223) >>> 0;
    out += PP_ALPHABET[(n >>> 16) % PP_ALPHABET.length]!;
  }
  return out;
}

/** Slots used by `npm run db:seed` today, plus headroom for future demo rows. */
const PITCH_SEED_SLOT_COUNT = 32;

function buildPitchSeedIdSet(): Set<string> {
  const ids = new Set<string>();
  for (let n = 1; n <= PITCH_SEED_SLOT_COUNT; n++) {
    ids.add(ppChars(0x10000000 + n * 7919, 17)); // order
    ids.add(ppChars(0x20000000 + n * 6151, 17)); // auth
    ids.add(ppChars(0x30000000 + n * 5281, 17)); // capture
    ids.add(ppChars(0x40000000 + n * 4723, 17)); // refund
    ids.add(ppChars(0x60000000 + n * 8191, 13)); // payout batch
    ids.add(ppChars(0x70000000 + n * 7351, 13)); // payout item
    const a = ppChars(0x51000000 + n * 3343 + 11, 4);
    const b = ppChars(0x52000000 + n * 3343 + 29, 4);
    const c = ppChars(0x53000000 + n * 3343 + 47, 4);
    const d = ppChars(0x54000000 + n * 3343 + 61, 4);
    ids.add(`INV2-${a}-${b}-${c}-${d}`);
    ids.add(`WH-${ppChars(0x80000000 + n * 9001, 17)}-${ppChars(0x81000000 + n * 11003, 17)}`);
    ids.add(`PP-D-${ppChars(0x90000000 + n * 4211, 13)}`);
  }
  // Extra webhook ids used outside the 1..N job loop in seed.mjs
  ids.add(
    `WH-${ppChars(0x80000000 + 100 * 9001, 17)}-${ppChars(0x81000000 + 100 * 11003, 17)}`,
  );
  return ids;
}

const PITCH_SEED_IDS = buildPitchSeedIdSet();

/** Explicit mock / legacy seed prefixes from older datasets. */
export function isPrefixedDemoPayPalId(id: string): boolean {
  return id.startsWith("MOCK-") || id.startsWith("SEED-") || id === "test";
}

/** True for deterministic pitch-seed IDs from prisma/seed.mjs. */
export function isPitchSeedPayPalId(id: string): boolean {
  return PITCH_SEED_IDS.has(id);
}

/**
 * Any PayPal resource id that must not be sent to the live sandbox API.
 * Real checkout-created order/auth/capture IDs never match these patterns.
 */
export function isSyntheticPayPalId(id: string | null | undefined): boolean {
  if (!id) return false;
  return isPrefixedDemoPayPalId(id) || isPitchSeedPayPalId(id);
}

/** Pitch jobs are tagged in seed via internalNotes / paypalJson.source. */
export function isPitchSeedJob(job: {
  internalNotes?: string | null;
  paypal?: { source?: string } | null;
}): boolean {
  if (job.internalNotes?.startsWith("[pitch-seed]")) return true;
  if (job.paypal?.source === "pitch-seed") return true;
  return false;
}
