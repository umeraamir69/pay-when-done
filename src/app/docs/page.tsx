import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Docs" };

const cards = [
  {
    href: "/docs/features",
    title: "Feature catalog",
    body: "Everything shipped — escrow, PayPal APIs, Muse, passkeys, admin, exports.",
  },
  {
    href: "/docs/architecture",
    title: "Architecture",
    body: "Auth, Prisma DB, money flow, AI verification, and webhook pipeline.",
  },
  {
    href: "/docs/swagger",
    title: "Swagger UI",
    body: "Interactive OpenAPI docs (sign-in required) — endpoints, schemas, auth.",
  },
  {
    href: "/docs/api",
    title: "API reference",
    body: "REST endpoints for jobs, PayPal actions, admin, health, and notifications.",
  },
  {
    href: "/templates",
    title: "Job templates",
    body: "Ready-made briefs for cleaning, moving, tutoring, handyman, creative.",
  },
  {
    href: "/how-it-works",
    title: "Product walkthrough",
    body: "Hold → Prove → Verify → Pay explained for judges and new users.",
  },
  {
    href: "/faq",
    title: "FAQ",
    body: "Common questions about money holds, Muse, sandbox, and disputes.",
  },
];

export default function DocsPage() {
  return (
    <div className="page-shell wide">
      <p className="eyebrow">Documentation</p>
      <h1>PayWhenDone docs</h1>
      <p className="lede narrow">
        Product, architecture, and API docs for builders and hackathon judges.
      </p>
      <div className="docs-grid">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="docs-card panel">
            <h2>{card.title}</h2>
            <p className="muted">{card.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
