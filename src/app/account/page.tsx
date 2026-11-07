import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountPasskeys } from "@/components/AccountPasskeys";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="page-shell wide">
      <p className="eyebrow">Security</p>
      <h1>Your account</h1>
      <p className="lede narrow" style={{ marginBottom: "1.5rem" }}>
        Add a passkey for passwordless (passkey) sign-in on every visit — Face
        ID, Touch ID, or Windows Hello. No password next time.
      </p>
      <Suspense fallback={<p className="muted">Loading account…</p>}>
        <AccountPasskeys />
      </Suspense>
    </div>
  );
}
