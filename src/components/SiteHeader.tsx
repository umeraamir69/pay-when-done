"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { BrandMark } from "@/components/BrandMark";

const marketingLinks = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/templates", label: "Templates" },
  { href: "/jobs", label: "Jobs" },
  { href: "/docs", label: "Docs" },
];

function linkActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open || isAdminRoute) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, isAdminRoute]);

  // Admin console uses its own chrome (sidebar layout).
  if (isAdminRoute) {
    return null;
  }

  const navLinks = (
    <>
      {marketingLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={linkActive(pathname, link.href) ? "active" : undefined}
          onClick={() => setOpen(false)}
        >
          {link.label}
        </Link>
      ))}
      {session ? (
        <Link
          href="/create"
          className={
            linkActive(pathname, "/create")
              ? "active header-nav-create"
              : "header-nav-create"
          }
          onClick={() => setOpen(false)}
        >
          New job
        </Link>
      ) : null}
    </>
  );

  const actions = session ? (
    <>
      <Link
        href="/notifications"
        className="header-settings"
        onClick={() => setOpen(false)}
      >
        Alerts
      </Link>
      <Link
        href="/account"
        className="header-account"
        onClick={() => setOpen(false)}
      >
        <span className="header-account-label">Account</span>
        <span className="header-account-name">
          {session.user.name || session.user.email}
        </span>
      </Link>
      <button
        type="button"
        className="btn-ghost header-cta"
        onClick={() => {
          setOpen(false);
          void signOut();
        }}
      >
        Sign out
      </button>
    </>
  ) : (
    <>
      <Link
        href="/login"
        className="header-settings"
        onClick={() => setOpen(false)}
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="btn-primary header-cta"
        onClick={() => setOpen(false)}
      >
        Get started
      </Link>
    </>
  );

  return (
    <header className={`site-header${open ? " is-nav-open" : ""}`}>
      <Link href="/" className="brand-link" aria-label="PayWhenDone home">
        <BrandMark />
      </Link>

      <nav className="site-nav-desktop" aria-label="Primary">
        {navLinks}
      </nav>

      <div className="header-actions header-actions-desktop">{actions}</div>

      <button
        type="button"
        className="header-menu-btn"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="header-menu-icon" aria-hidden="true" />
        <span className="header-menu-text">{open ? "Close" : "Menu"}</span>
      </button>

      {open ? (
        <button
          type="button"
          className="header-drawer-backdrop"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div id={menuId} className="header-drawer" hidden={!open}>
        <nav className="site-nav-mobile" aria-label="Primary">
          {navLinks}
        </nav>
        <div className="header-actions header-actions-mobile">{actions}</div>
      </div>
    </header>
  );
}
