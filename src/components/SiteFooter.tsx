"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";

const productLinks = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/templates", label: "Templates" },
  { href: "/jobs", label: "Jobs" },
  { href: "/faq", label: "FAQ" },
];

const resourceLinks = [
  { href: "/docs", label: "Docs" },
  { href: "/docs/features", label: "Features" },
  { href: "/docs/api", label: "API" },
  { href: "/create", label: "New job" },
];

const accountLinks = [
  { href: "/account", label: "Account" },
  { href: "/settings", label: "Settings" },
  { href: "/notifications", label: "Alerts" },
  { href: "/login", label: "Sign in" },
];

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link href="/" className="brand-link" aria-label="PayWhenDone home">
            <BrandMark size={32} />
          </Link>
          <p className="footer-tagline">
            Hold PayPal payment in escrow until the work is AI-verified done.
          </p>
          <p className="footer-stack">PayPal · Muse AI · Better Auth</p>
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

        <nav className="footer-col" aria-label="Resources">
          <h2 className="footer-heading">Resources</h2>
          <ul className="footer-links">
            {resourceLinks.map((link) => (
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
          Built for off-platform local gigs — pay when the work is done.
        </p>
      </div>
    </footer>
  );
}
