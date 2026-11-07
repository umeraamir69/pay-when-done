import Link from "next/link";
import type { Metadata } from "next";
import { FEATURES } from "@/lib/feature-catalog";

export const metadata: Metadata = { title: "Features" };

export default function FeaturesDocPage() {
  return (
    <div className="page-shell wide">
      <p className="eyebrow">Docs</p>
      <h1>Feature catalog</h1>
      <p className="lede narrow">
        Full list of product capabilities. Also mirrored in{" "}
        <code>docs/FEATURES.md</code>.
      </p>

      {FEATURES.map((group) => (
        <section key={group.title} className="panel" style={{ marginTop: "1rem" }}>
          <h2>{group.title}</h2>
          <ul className="feature-checklist">
            {group.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}

      <div className="cta-row">
        <Link href="/docs" className="btn-ghost">
          Docs home
        </Link>
        <Link href="/docs/api" className="btn-primary">
          API reference
        </Link>
      </div>
    </div>
  );
}
