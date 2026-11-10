import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="page-shell wide">
      <section
        className="about-founder reveal"
        aria-labelledby="about-founder-heading"
      >
        <div className="about-founder-grid">
          <div className="about-founder-photo-wrap">
            <Image
              src="/images/umer-aamir.jpg"
              alt="Muhammad Umer Aamir"
              width={640}
              height={640}
              className="about-founder-photo"
              priority
            />
          </div>
          <div className="about-founder-copy">
            <p className="eyebrow">Founder</p>
            <h1 id="about-founder-heading">Muhammad Umer Aamir</h1>
            <p className="about-founder-role">
              Founder · Umer Admin · PayWhenDone
            </p>
            <p className="muted about-founder-bio">
              MAC student at Wilfrid Laurier in the Brantford / Waterloo area. I
              ship full-stack work in TypeScript and Next.js — from security
              tools like SecSentry to ApplySafe for Canadian job-scam checks.
              PayWhenDone is my PayPal AI Hackathon entry: sandbox escrow rails,
              Muse verification, and passkeys in one working demo.
            </p>
            <div className="cta-row section-cta">
              <a
                href="https://github.com/umeraamir69/pay-when-done"
                className="btn-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub repo
              </a>
              <a
                href="https://github.com/umeraamir69"
                className="btn-ghost"
                target="_blank"
                rel="noopener noreferrer"
              >
                Profile
              </a>
              <a
                href="https://www.linkedin.com/in/umeraamir69/"
                className="btn-ghost"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        className="about-section about-product-intro"
        aria-labelledby="about-product-heading"
      >
        <p className="eyebrow">The product</p>
        <h2 id="about-product-heading">PayWhenDone</h2>
        <p className="lede narrow">
          AI-verified PayPal escrow for local gigs hired off-platform — Facebook,
          Nextdoor, WhatsApp, word of mouth. Not a marketplace. Hold funds, prove
          the work, let Muse verify, then pay.
        </p>
        <div className="cta-row section-cta">
          <Link href="/how-it-works" className="btn-primary">
            How it works
          </Link>
          <Link href="/create" className="btn-ghost">
            Try a demo job
          </Link>
        </div>
      </section>
    </div>
  );
}
