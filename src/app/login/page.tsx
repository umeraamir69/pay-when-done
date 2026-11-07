import type { Metadata } from "next";
import { AuthPanel } from "@/components/AuthPanel";
import { isEmailAuthConfigured } from "@/lib/email";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthPanel mode="login" emailAuthEnabled={isEmailAuthConfigured()} />
  );
}
