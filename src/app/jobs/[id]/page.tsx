import { notFound } from "next/navigation";
import { JobWorkspace } from "@/components/JobWorkspace";
import { getJob } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();
  return <JobWorkspace initialJob={job} />;
}
