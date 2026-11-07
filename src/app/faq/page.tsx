import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
};

const faqs = [
  {
    q: "Is money taken immediately?",
    a: "No. PayPal authorizes (holds) the amount. Capture happens only after Muse approves the proof — or you void the hold.",
  },
  {
    q: "What AI do you use?",
    a: "Meta Muse via the Model API (muse-spark-1.3 by default). It reads the proof image and worker notes against your brief.",
  },
  {
    q: "Do I need PayPal live credentials?",
    a: "For the hackathon, use a free PayPal sandbox app. Without keys, the app runs a mock authorize/capture flow so you can still demo Muse.",
  },
  {
    q: "What if the AI is wrong?",
    a: "Rejection does not auto-void. The worker can resubmit better proof, or the client can void the hold. Extending with a dispute agent is on the roadmap.",
  },
  {
    q: "Is this a marketplace?",
    a: "No. You already found the worker on Facebook, Nextdoor, WhatsApp, or word of mouth. PayWhenDone only protects the payment.",
  },
  {
    q: "Can teams use this for the hackathon?",
    a: "Yes. Solo or team. Keep the repo public with an MIT license, a working demo, and a ≤3 minute YouTube video.",
  },
];

export default function FaqPage() {
  return (
    <div className="page-shell wide">
      <p className="eyebrow">FAQ</p>
      <h1>Questions, answered</h1>
      <p className="lede narrow">
        Short answers for clients, workers, and hackathon judges.
      </p>

      <div className="faq-list">
        {faqs.map((item) => (
          <details key={item.q} className="faq-item">
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>

      <div className="cta-row" style={{ marginTop: "2rem" }}>
        <Link href="/create" className="btn-primary">
          Create an escrow job
        </Link>
        <Link href="/how-it-works" className="btn-ghost">
          How it works
        </Link>
      </div>
    </div>
  );
}
