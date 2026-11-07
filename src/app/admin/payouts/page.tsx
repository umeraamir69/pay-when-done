import type { Metadata } from "next";
import { AdminPayoutsPanel } from "@/components/AdminPayoutsPanel";

export const metadata: Metadata = {
  title: "Admin · Payouts",
};

export default function AdminPayoutsPage() {
  return <AdminPayoutsPanel />;
}
