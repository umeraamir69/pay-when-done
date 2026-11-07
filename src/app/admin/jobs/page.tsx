import type { Metadata } from "next";
import { AdminJobsPanel } from "@/components/AdminJobsPanel";

export const metadata: Metadata = {
  title: "Admin · Jobs",
};

export default function AdminJobsPage() {
  return <AdminJobsPanel />;
}
