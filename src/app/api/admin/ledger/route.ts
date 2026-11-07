import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import {
  listInvoices,
  listLedger,
  listPayouts,
  listWebhooks,
} from "@/lib/store";

export async function GET() {
  const admin = await requireAdminSession();
  if (admin.error) return admin.error;

  const [ledger, invoices, payouts, webhooks] = await Promise.all([
    listLedger(),
    listInvoices(),
    listPayouts(),
    listWebhooks(),
  ]);

  return NextResponse.json({ ledger, invoices, payouts, webhooks });
}
