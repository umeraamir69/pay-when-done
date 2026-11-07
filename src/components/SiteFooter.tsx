import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <p className="brand">PayWhenDone</p>
          <p className="muted">
            AI-verified PayPal escrow for off-platform local gigs — with
            passkeys, Prisma DB, and full PayPal money rails.
          </p>
        </div>
        <div className="footer-links">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/templates">Templates</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/docs/features">Features</Link>
          <Link href="/docs/api">API</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/admin">Admin</Link>
          <Link href="/settings">Settings</Link>
        </div>
        <div className="footer-meta">
          <p>PayPal · Muse AI · Better Auth Passkeys · Prisma</p>
          <p className="muted">PayPal AI Hackathon · MIT License</p>
        </div>
      </div>
    </footer>
  );
}
