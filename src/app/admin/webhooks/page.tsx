import type { Metadata } from "next";
import { AdminWebhooksPanel } from "@/components/AdminWebhooksPanel";

export const metadata: Metadata = {
  title: "Admin · Webhooks",
};

export default function AdminWebhooksPage() {
  return <AdminWebhooksPanel />;
}
