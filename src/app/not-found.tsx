import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p className="lede narrow">
        That route doesn’t exist. Head back to create a job or browse your
        escrow list.
      </p>
      <div className="cta-row">
        <Link href="/" className="btn-primary">
          Home
        </Link>
        <Link href="/jobs" className="btn-ghost">
          Jobs
        </Link>
      </div>
    </div>
  );
}
