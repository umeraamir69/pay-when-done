import Link from "next/link";
import type { Metadata } from "next";
import { TemplatesLibrary } from "@/components/TemplatesLibrary";
import { JOB_TEMPLATES } from "@/lib/templates";

export const metadata: Metadata = { title: "Templates" };

export default function TemplatesPage() {
  return (
    <div className="page-shell templates-shell">
      <div className="templates-hero">
        <div>
          <p className="eyebrow">Library</p>
          <h1>Job templates</h1>
          <p className="lede">
            Battle-tested briefs with clear “done” criteria and suggested
            amounts. Pick one, fund escrow, and get paid when the work checks
            out — {JOB_TEMPLATES.length} ready to customize.
          </p>
        </div>
        <Link href="/create" className="btn-primary">
          Create job
        </Link>
      </div>

      <TemplatesLibrary />
    </div>
  );
}
