import { notFound, redirect } from "next/navigation";
import { JobWorkspace } from "@/components/JobWorkspace";
import { canManageJob } from "@/lib/job-access";
import { getServerSession } from "@/lib/session";
import { getJob } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();
  const { id } = await params;
  if (!session) {
    redirect(`/login?next=/jobs/${encodeURIComponent(id)}`);
  }

  const job = await getJob(id);
  if (!job) notFound();
  if (!canManageJob(job, session)) {
    redirect("/jobs");
  }

  return <JobWorkspace initialJob={job} />;
}
