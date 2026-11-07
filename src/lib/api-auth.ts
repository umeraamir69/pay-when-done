import { NextResponse } from "next/server";
import { getServerSession } from "./session";

export async function requireApiSession() {
  return getServerSession();
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/** Optional allow-list. If ADMIN_EMAILS is unset, any signed-in user may access admin APIs. */
export function isAdminEmail(email: string | null | undefined) {
  const raw = process.env.ADMIN_EMAILS || "";
  const allow = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!allow.length) return Boolean(email);
  return Boolean(email && allow.includes(email.toLowerCase()));
}

export async function requireAdminSession() {
  const session = await requireApiSession();
  if (!session) return { session: null, error: unauthorized() };
  if (!isAdminEmail(session.user.email)) {
    return { session: null, error: forbidden("Admin access required") };
  }
  return { session, error: null };
}
