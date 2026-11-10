import type { Metadata } from "next";
import { CreateJobForm } from "@/components/CreateJobForm";

export const metadata: Metadata = {
  title: "Create job",
};

export default function CreatePage() {
  return (
    <div className="page-shell create-shell">
      <p className="eyebrow">New escrow</p>
      <h1>Describe the job. Hold the money.</h1>
      <p className="lede narrow create-shell-lede">
        Five short steps: template, details, people, PayPal options, then
        review. Funds stay held until Muse verifies the work.
      </p>
      <CreateJobForm />
    </div>
  );
}
