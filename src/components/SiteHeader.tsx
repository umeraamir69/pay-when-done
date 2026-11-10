"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useId, useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { initialsFromName } from "@/lib/avatar";
import { BrandMark } from "@/components/BrandMark";
import { NavIcon, type NavIconName } from "@/components/NavIcons";
import { PitchModeEntry } from "@/components/PitchModeEntry";
import { readPitchModePreference } from "@/lib/pitch";

type NavLink = {
  href: string;
  label: string;
  icon: NavIconName;
};

const marketingLinks: NavLink[] = [
  { href: "/about", label: "About", icon: "about" },
  { href: "/how-it-works", label: "How it works", icon: "how" },
  { href: "/templates", label: "Templates", icon: "templates" },
  { href: "/jobs", label: "Jobs", icon: "jobs" },
  { href: "/docs", label: "Docs", icon: "docs" },
];

/** Client hint mirroring ADMIN_EMAILS for header chrome (Pitch + Admin badge). */
const ADMIN_HINT_EMAILS = new Set(
  (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "umer@umer.com")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

function linkActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isAdminHint(email: string | null | undefined) {
  if (!email) return false;
  return ADMIN_HINT_EMAILS.has(email.toLowerCase());
}

function HeaderAvatar({
  image,
  name,
  email,
}: {
  image?: string | null;
  name?: string | null;
  email?: string | null;
}) {
  const initials = initialsFromName(name, email);
  return (
    <span
      className="header-avatar"
      role={image ? "img" : undefined}
      aria-label={image ? "Profile picture" : undefined}
      aria-hidden={image ? undefined : true}
      style={
        image
          ? {
              backgroundImage: `url(${image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {image ? null : <span className="header-avatar-initials">{initials}</span>}
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [pitchPref, setPitchPref] = useState(false);
  const menuId = useId();
  const isAdminRoute = pathname.startsWith("/admin");
  const isPitchRoute = pathname.startsWith("/pitch");
  const isAdmin = isAdminHint(session?.user?.email);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    setPitchPref(readPitchModePreference());
  }, [pathname]);

  useEffect(() => {
    if (!open || isAdminRoute || isPitchRoute) return;
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
  }, [open, isAdminRoute, isPitchRoute]);

  // Admin console and pitch deck use their own chrome.
  if (isAdminRoute || isPitchRoute) {
    return (
      <Suspense fallback={null}>
        <PitchModeEntry />
      </Suspense>
    );
  }

  const showPitchLink = pitchPref || isAdmin;
  const displayName = session?.user?.name || session?.user?.email || "Account";

  const navLinks = (
    <>
      {marketingLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={
            linkActive(pathname, link.href) ? "nav-link active" : "nav-link"
          }
          aria-current={linkActive(pathname, link.href) ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          <NavIcon name={link.icon} size={15} />
          <span>{link.label}</span>
        </Link>
      ))}
      {session ? (
        <Link
          href="/create"
          className={
            linkActive(pathname, "/create")
              ? "nav-link active header-nav-create"
              : "nav-link header-nav-create"
          }
          aria-current={linkActive(pathname, "/create") ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          <NavIcon name="create" size={15} />
          <span>New job</span>
        </Link>
      ) : null}
    </>
  );

  const pitchLink = showPitchLink ? (
    <Link
      href="/pitch"
      className={
        linkActive(pathname, "/pitch")
          ? "nav-link active header-pitch"
          : "nav-link header-pitch"
      }
      aria-current={linkActive(pathname, "/pitch") ? "page" : undefined}
      onClick={() => setOpen(false)}
      title="Open pitch mode"
    >
      <NavIcon name="features" size={15} />
      <span>Pitch</span>
    </Link>
  ) : null;

  const actions = session ? (
    <>
      {pitchLink}
      <Link
        href="/notifications"
        className="header-settings nav-link"
        onClick={() => setOpen(false)}
      >
        <NavIcon name="alerts" size={15} />
        <span>Alerts</span>
      </Link>
      <Link
        href="/account"
        className={
          linkActive(pathname, "/account")
            ? "header-account is-active"
            : "header-account"
        }
        aria-current={linkActive(pathname, "/account") ? "page" : undefined}
        onClick={() => setOpen(false)}
      >
        <HeaderAvatar
          image={session.user.image}
          name={session.user.name}
          email={session.user.email}
        />
        <span className="header-account-name">{displayName}</span>
      </Link>
      {isAdmin ? (
        <Link
          href="/admin"
          className="header-admin-badge"
          onClick={() => setOpen(false)}
        >
          Admin
        </Link>
      ) : null}
      <button
        type="button"
        className="header-signout"
        aria-label="Sign out"
        title="Sign out"
        onClick={() => {
          setOpen(false);
          void signOut();
        }}
      >
        <NavIcon name="logout" size={15} />
        <span className="header-signout-label">Sign out</span>
      </button>
    </>
  ) : (
    <>
      {pitchLink}
      <Link
        href="/login"
        className="header-settings nav-link"
        onClick={() => setOpen(false)}
      >
        <NavIcon name="login" size={15} />
        <span>Sign in</span>
      </Link>
      <Link
        href="/signup"
        className="btn-primary header-cta nav-link"
        onClick={() => setOpen(false)}
      >
        <span>Get started</span>
      </Link>
    </>
  );

  return (
    <header className={`site-header${open ? " is-nav-open" : ""}`}>
      <Suspense fallback={null}>
        <PitchModeEntry />
      </Suspense>
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
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        <NavIcon name={open ? "close" : "menu"} size={16} />
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
