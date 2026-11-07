import type { Metadata } from "next";
import { AccountPasskeys } from "@/components/AccountPasskeys";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="page-shell wide">
      <p className="eyebrow">Security</p>
      <h1>Your account</h1>
      <p className="lede narrow" style={{ marginBottom: "1.5rem" }}>
        Manage passkeys for passwordless sign-in on every visit.
      </p>
      <AccountPasskeys />
    </div>
  );
}
