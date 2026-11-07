import type { Metadata } from "next";
import { AccountPasskeys } from "@/components/AccountPasskeys";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="page-shell wide">
      <p className="eyebrow">Security</p>
      <h1>Your account</h1>
      <p className="lede narrow" style={{ marginBottom: "1.5rem" }}>
        Update your profile, password, and optional passkeys. Sign in with email
        and password anytime.
      </p>
      <AccountPasskeys />
    </div>
  );
}
