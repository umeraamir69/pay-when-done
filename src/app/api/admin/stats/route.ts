import { NextResponse } from "next/server";
import { getStats } from "@/lib/store";
import { requireAdminSession } from "@/lib/api-auth";

export async function GET() {
  const admin = await requireAdminSession();
  if (admin.error) return admin.error;

  const stats = await getStats();
  return NextResponse.json({ stats });
}
