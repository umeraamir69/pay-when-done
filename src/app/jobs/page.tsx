import Link from "next/link";
import type { Metadata } from "next";
import { listJobs } from "@/lib/store";
import {
  categoryLabel,
  formatMoney,
  statusLabel,
} from "@/lib/format";

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

      {jobs.length === 0 ? (
        <div className="empty-state panel">
          <h2>No jobs yet</h2>
          <p className="muted">
            Create an escrow job, or load demo data from the admin dashboard.
          </p>
          <div className="cta-row" style={{ marginTop: 0 }}>
            <Link href="/create" className="btn-primary">
              Create first job
            </Link>
            <Link href="/admin" className="btn-ghost">
              Open admin
            </Link>
          </div>
        </div>
      ) : (
        <div className="job-list">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="job-row">
              <div>
                <strong>{job.title}</strong>
                <div className="muted job-row-meta">
                  {job.clientName} → {job.workerName}
                  <span className={`status-chip status-${job.status}`}>
                    {statusLabel(job.status)}
                  </span>
                  <span className="status-chip">{categoryLabel(job.category)}</span>
                  {job.priority === "high" ? (
                    <span className="priority-flag">High</span>
                  ) : null}
                </div>
              </div>
              <strong className="job-row-amount">
                {formatMoney(job.amount, job.currency)}
              </strong>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
