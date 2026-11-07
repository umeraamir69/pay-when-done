import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * After the user enters email on login, check whether that account has a passkey.
 * Always returns 200 with a boolean — unknown emails look like "no passkey"
 * so we don't leak whether the account exists beyond that soft signal.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ hasPasskey: false });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        _count: { select: { passkeys: true } },
      },
    });

    return NextResponse.json({
      hasPasskey: Boolean(user && user._count.passkeys > 0),
    });
  } catch {
    return NextResponse.json({ hasPasskey: false });
  }
}
