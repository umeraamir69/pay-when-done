import type { Metadata } from "next";
import { AccountPasskeys } from "@/components/AccountPasskeys";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="page-shell wide">
      <p className="eyebrow">Account</p>
      <h1>Your account</h1>
      <p className="lede narrow" style={{ marginBottom: "1.5rem" }}>
        Manage your profile, password, and optional passkeys. Email and password
        always work for sign-in.
      </p>
      <AccountPasskeys />
    </div>
  );
}
