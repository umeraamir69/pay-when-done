import type { Metadata } from "next";
import { AdminInvoicesPanel } from "@/components/AdminInvoicesPanel";

export const metadata: Metadata = {
  title: "Admin · Invoices",
};

export default function AdminInvoicesPage() {
  return <AdminInvoicesPanel />;
}
