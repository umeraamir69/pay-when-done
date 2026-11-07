import type { Metadata } from "next";
import { CreateJobForm } from "@/components/CreateJobForm";

export const metadata: Metadata = {
  title: "Create job",
};

export default function CreatePage() {
  return (
    <div className="page-shell">
      <p className="eyebrow">New escrow</p>
      <h1>Describe the job. Hold the money.</h1>
      <p className="lede narrow" style={{ marginBottom: "1.5rem" }}>
        Write acceptance criteria Muse can check. Next you’ll authorize PayPal
        funds — captured only after verification.
      </p>
      <CreateJobForm />
    </div>
  );
}
