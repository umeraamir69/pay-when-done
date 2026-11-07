import Link from "next/link";
import type { Metadata } from "next";
import { listJobs } from "@/lib/store";
import { JobsList } from "@/components/JobsList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs",
};

export default async function JobsPage() {
  const jobs = await listJobs();

  return (
    <div className="page-shell wide">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Jobs</h1>
          <p className="muted">
            Every escrow from hold to release — including disputes.
          </p>
        </div>
        <div className="cta-row" style={{ marginTop: 0 }}>
          <Link href="/admin" className="btn-ghost">
            Admin
          </Link>
          <Link href="/create" className="btn-primary">
            New job
          </Link>
        </div>
      </div>

      <JobsList initialJobs={jobs} />
    </div>
  );
}
