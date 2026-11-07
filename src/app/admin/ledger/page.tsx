import type { Metadata } from "next";
import { AdminLedgerPanel } from "@/components/AdminLedgerPanel";

export const metadata: Metadata = {
  title: "Admin · Ledger",
};

export default function AdminLedgerPage() {
  return <AdminLedgerPanel />;
}
