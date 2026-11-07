"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { BrandMark } from "@/components/BrandMark";

const links = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/templates", label: "Templates" },
  { href: "/create", label: "New job" },
  { href: "/jobs", label: "Jobs" },
  { href: "/docs", label: "Docs" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Admin console uses its own chrome (sidebar layout).
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="site-header">
      <Link href="/" className="brand-link" aria-label="PayWhenDone home">
        <BrandMark />
      </Link>
      <nav>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              pathname === link.href || pathname.startsWith(`${link.href}/`)
                ? "active"
                : undefined
            }
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        {session ? (
          <>
            <Link href="/notifications" className="header-settings">
              Alerts
            </Link>
            <Link href="/account" className="header-settings">
              {session.user.name || "Account"}
            </Link>
            <Link href="/admin" className="header-settings">
              Admin
            </Link>
            <button
              type="button"
              className="btn-ghost header-cta"
              onClick={() => signOut()}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="header-settings">
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary header-cta">
              Get started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
