"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";
import { NavIcon, type NavIconName } from "@/components/NavIcons";

type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  match?: "exact" | "prefix";
};

const consoleNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", match: "exact" },
  { href: "/admin/jobs", label: "Jobs", icon: "jobs", match: "prefix" },
  { href: "/admin/ledger", label: "Ledger", icon: "ledger", match: "prefix" },
  {
    href: "/admin/invoices",
    label: "Invoices",
    icon: "invoices",
    match: "prefix",
  },
  { href: "/admin/payouts", label: "Payouts", icon: "payouts", match: "prefix" },
  {
    href: "/admin/webhooks",
    label: "Webhooks",
    icon: "webhooks",
    match: "prefix",
  },
];

const workspaceNav: NavItem[] = [
  { href: "/jobs", label: "Jobs board", icon: "jobs", match: "prefix" },
  { href: "/create", label: "New job", icon: "create", match: "exact" },
  { href: "/pitch", label: "Pitch", icon: "features", match: "exact" },
  { href: "/settings", label: "Settings", icon: "settings", match: "prefix" },
  {
    href: "/notifications",
    label: "Alerts",
    icon: "alerts",
    match: "prefix",
  },
  { href: "/docs", label: "Docs", icon: "docs", match: "prefix" },
];

function isActive(pathname: string, item: NavItem) {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function renderNav(items: NavItem[]) {
    return items.map((item) => {
      const active = isActive(pathname, item);
      return (
        <Link
          key={item.href}
          href={item.href}
          className={active ? "admin-nav-link active" : "admin-nav-link"}
          aria-current={active ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          <NavIcon name={item.icon} size={15} />
          <span>{item.label}</span>
        </Link>
      );
    });
  }

  return (
    <div className={`admin-console${open ? " is-drawer-open" : ""}`}>
      <div className="admin-mobile-bar">
        <button
          type="button"
          className="admin-menu-btn"
          aria-expanded={open}
          aria-controls="admin-sidebar"
          onClick={() => setOpen((value) => !value)}
        >
          <NavIcon name={open ? "close" : "menu"} size={16} />
          Menu
        </button>
        <Link href="/admin" className="admin-mobile-brand">
          PayWhenDone Admin
        </Link>
      </div>

      {open ? (
        <button
          type="button"
          className="admin-drawer-backdrop"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        id="admin-sidebar"
        className="admin-sidebar"
        aria-labelledby={titleId}
      >
        <div className="admin-sidebar-top">
          <Link href="/admin" className="admin-sidebar-brand">
            <span className="admin-sidebar-mark">PayWhenDone</span>
            <span id={titleId} className="admin-sidebar-product">
              Operations
            </span>
          </Link>

          <nav className="admin-nav" aria-label="Admin console">
            <p className="admin-nav-label">Console</p>
            {renderNav(consoleNav)}
          </nav>

          <nav className="admin-nav" aria-label="Workspace">
            <p className="admin-nav-label">Workspace</p>
            {renderNav(workspaceNav)}
          </nav>
        </div>

        <div className="admin-sidebar-footer">
          {session?.user ? (
            <div className="admin-session">
              <strong>{session.user.name || "Signed in"}</strong>
              <span>{session.user.email}</span>
            </div>
          ) : (
            <div className="admin-session">
              <strong>Session</strong>
              <span>Loading…</span>
            </div>
          )}
          <div className="admin-sidebar-actions">
            <Link href="/" className="admin-nav-link">
              <NavIcon name="home" size={15} />
              <span>Back to site</span>
            </Link>
            <button
              type="button"
              className="admin-signout"
              onClick={() => signOut()}
            >
              <NavIcon name="logout" size={15} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-main-inner">{children}</div>
      </div>
    </div>
  );
}
