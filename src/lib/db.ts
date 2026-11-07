/** Shared ID helper (legacy import path). Prefer crypto.randomUUID(). */
export function newId() {
  return crypto.randomUUID();
}
