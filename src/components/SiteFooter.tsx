import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

const productLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/templates", label: "Templates" },
  { href: "/create", label: "New job" },
  { href: "/jobs", label: "Jobs" },
  { href: "/faq", label: "FAQ" },
];

const docsLinks = [
  { href: "/docs", label: "Overview" },
  { href: "/docs/features", label: "Features" },
  { href: "/docs/api", label: "API" },
];

const accountLinks = [
  { href: "/account", label: "Account" },
  { href: "/settings", label: "Settings" },
  { href: "/admin", label: "Admin" },
  { href: "/login", label: "Sign in" },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link href="/" className="brand-link" aria-label="PayWhenDone home">
            <BrandMark size={32} />
          </Link>
          <p className="footer-tagline">
            AI-verified PayPal escrow for off-platform local gigs.
          </p>
          <p className="footer-stack">
            PayPal · Muse AI · Better Auth · Prisma
          </p>
        </div>

        <nav className="footer-col" aria-label="Product">
          <h2 className="footer-heading">Product</h2>
          <ul className="footer-links">
            {productLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer-col" aria-label="Docs">
          <h2 className="footer-heading">Docs</h2>
          <ul className="footer-links">
            {docsLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer-col" aria-label="Account">
          <h2 className="footer-heading">Account</h2>
          <ul className="footer-links">
            {accountLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="footer-bottom">
        <p className="footer-legal">PayPal AI Hackathon · MIT License</p>
        <p className="footer-legal muted">
          Hold payment until the work is verified done.
        </p>
      </div>
    </footer>
  );
}
