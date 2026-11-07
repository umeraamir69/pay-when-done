"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { NavIcon, type NavIconName } from "@/components/NavIcons";

type FooterLink = {
  href: string;
  label: string;
  icon: NavIconName;
};

const productLinks: FooterLink[] = [
  { href: "/about", label: "About", icon: "about" },
  { href: "/how-it-works", label: "How it works", icon: "how" },
  { href: "/templates", label: "Templates", icon: "templates" },
  { href: "/jobs", label: "Jobs", icon: "jobs" },
  { href: "/faq", label: "FAQ", icon: "faq" },
];

const resourceLinks: FooterLink[] = [
  { href: "/docs", label: "Docs", icon: "docs" },
  { href: "/docs/features", label: "Features", icon: "features" },
  { href: "/docs/api", label: "API", icon: "api" },
  { href: "/create", label: "New job", icon: "create" },
];

const accountLinks: FooterLink[] = [
  { href: "/account", label: "Account", icon: "account" },
  { href: "/settings", label: "Settings", icon: "settings" },
  { href: "/notifications", label: "Alerts", icon: "alerts" },
  { href: "/login", label: "Sign in", icon: "login" },
];

function FooterLinkList({
  links,
  label,
}: {
  links: FooterLink[];
  label: string;
}) {
  return (
    <nav className="footer-col" aria-label={label}>
      <h2 className="footer-heading">{label}</h2>
      <ul className="footer-links">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="footer-link">
              <NavIcon name={link.icon} size={14} className="footer-link-icon" />
              <span>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

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

        <FooterLinkList links={productLinks} label="Product" />
        <FooterLinkList links={resourceLinks} label="Resources" />
        <FooterLinkList links={accountLinks} label="Account" />
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
