import { NextResponse } from "next/server";
import { requireApiSession, unauthorized } from "@/lib/api-auth";
import { openApiSpec } from "@/lib/openapi";

export async function GET() {
  const session = await requireApiSession();
  if (!session) return unauthorized();

  return NextResponse.json(openApiSpec, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
