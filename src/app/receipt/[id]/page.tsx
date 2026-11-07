import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob } from "@/lib/store";
import {
  categoryLabel,
  formatDate,
  formatMoney,
  statusLabel,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  return (
    <div className="page-shell">
      <p className="eyebrow">Receipt</p>
      <h1>{job.title}</h1>
      <p className="muted">
        Escrow receipt · {statusLabel(job.status)} ·{" "}
        {formatDate(job.updatedAt)}
      </p>

      <article className="panel" style={{ marginTop: "1.25rem" }}>
        <dl className="settings-dl">
          <div>
            <dt>Amount</dt>
            <dd>{formatMoney(job.amount, job.currency)}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{categoryLabel(job.category)}</dd>
          </div>
          <div>
            <dt>Client</dt>
            <dd>{job.clientName}</dd>
          </div>
          <div>
            <dt>Worker</dt>
            <dd>
              {job.workerName} ({job.workerEmail})
            </dd>
          </div>
          <div>
            <dt>PayPal order</dt>
            <dd>{job.paypalOrderId || "—"}</dd>
          </div>
          <div>
            <dt>Authorization</dt>
            <dd>{job.paypalAuthorizationId || "—"}</dd>
          </div>
          <div>
            <dt>Capture</dt>
            <dd>{job.paypalCaptureId || "—"}</dd>
          </div>
          <div>
            <dt>Payout batch</dt>
            <dd>{job.paypalPayoutBatchId || "—"}</dd>
          </div>
          <div>
            <dt>Invoice</dt>
            <dd>{job.paypalInvoiceId || "—"}</dd>
          </div>
          {job.aiVerdict ? (
            <div>
              <dt>Muse verdict</dt>
              <dd>
                {job.aiVerdict.approved ? "Approved" : "Rejected"} ·{" "}
                {Math.round(job.aiVerdict.confidence * 100)}% ·{" "}
                {job.aiVerdict.provider}
              </dd>
            </div>
          ) : null}
          {job.workerRating ? (
            <div>
              <dt>Worker rating</dt>
              <dd>{job.workerRating}/5</dd>
            </div>
          ) : null}
        </dl>
      </article>

      <article className="panel" style={{ marginTop: "1rem" }}>
        <h2>Brief</h2>
        <p className="brief">{job.brief}</p>
      </article>

      <div className="cta-row">
        <Link href={`/jobs/${job.id}`} className="btn-primary">
          Open job
        </Link>
        <Link href="/docs" className="btn-ghost">
          Docs
        </Link>
      </div>
    </div>
  );
}
