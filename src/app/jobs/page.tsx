import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/api-auth";
import { getServerSession } from "@/lib/session";
import { listJobs } from "@/lib/store";
import { JobsList } from "@/components/JobsList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs",
};

export default async function JobsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/jobs");

  const isAdmin = isAdminEmail(session.user.email);
  let jobs = await listJobs();
  if (!isAdmin) {
    jobs = jobs.filter((job) => job.ownerId === session.user.id);
  }

  return (
    <div className="page-shell wide jobs-page">
      <div className="page-heading-row jobs-page-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Jobs</h1>
          <p className="muted jobs-page-lede">
            Every escrow from hold to release — including disputes.
          </p>
        </div>
        <div className="cta-row jobs-page-actions">
          {isAdmin ? (
            <Link href="/admin" className="btn-ghost">
              Admin
            </Link>
          ) : null}
          <Link href="/create" className="btn-primary">
            New job
          </Link>
        </div>
      </div>

      <JobsList initialJobs={jobs} />
    </div>
  );
}
