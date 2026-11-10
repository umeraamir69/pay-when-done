"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BackgroundAtmosphere } from "@/components/BackgroundAtmosphere";
import { authClient } from "@/lib/auth-client";

type Mode = "login" | "signup";
/** Login: email → then password and/or passkey depending on account */
type LoginStep = "email" | "auth";

function passkeyErrorMessage(err: unknown) {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Passkey failed";
  const lower = raw.toLowerCase();
  if (
    lower.includes("abort") ||
    lower.includes("cancel") ||
    lower.includes("not allowed") ||
    lower.includes("timed out") ||
    lower.includes("timeout")
  ) {
    return "Passkey cancelled or timed out. Use your password instead.";
  }
  if (lower.includes("credential") || lower.includes("no passkey")) {
    return "No passkey found on this device. Sign in with password, then register one on Account.";
  }
  return `${raw}. You can still sign in with your password.`;
}

export function AuthPanel({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginStep, setLoginStep] = useState<LoginStep>("email");
  const [hasPasskey, setHasPasskey] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function checkPasskeyStatus(nextEmail: string) {
    const res = await fetch("/api/auth/passkey-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: nextEmail }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      hasPasskey?: boolean;
    };
    return Boolean(data.hasPasskey);
  }

  async function onContinueEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setError("Enter a valid email to continue.");
      return;
    }
    setBusy("lookup");
    try {
      const found = await checkPasskeyStatus(trimmed);
      setEmail(trimmed);
      setHasPasskey(found);
      setLoginStep("auth");
      setInfo(
        found
          ? "Passkey found for this email — use it below, or sign in with password."
          : "No passkey on this account yet. Sign in with password, then register one on Account.",
      );
    } catch {
      setHasPasskey(false);
      setLoginStep("auth");
      setInfo("Sign in with your password.");
    } finally {
      setBusy(null);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match. Please confirm your password.");
      return;
    }

    setBusy("form");
    try {
      if (mode === "signup") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
        });
        if (err) throw new Error(err.message || "Sign up failed");
        router.push("/account?setup=passkey");
        router.refresh();
        return;
      }

      const { error: err } = await authClient.signIn.email({
        email,
        password,
      });
      if (err) throw new Error(err.message || "Sign in failed");

      if (!hasPasskey) {
        router.push("/account?setup=passkey");
      } else {
        router.push("/jobs");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(null);
    }
  }

  async function signInWithPasskey() {
    setBusy("passkey");
    setError(null);
    setInfo("Approve Face ID / Touch ID / your security key…");

    const timeoutMs = 45_000;
    const timeout = new Promise<never>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error("Passkey timed out"));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([
        // Discoverable credentials — email already confirmed via passkey-status
        authClient.signIn.passkey({}),
        timeout,
      ]);
      if (result?.error) {
        throw new Error(result.error.message || "Passkey sign-in failed");
      }
      router.push("/jobs");
      router.refresh();
    } catch (err) {
      setInfo(null);
      setError(passkeyErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  function changeEmail() {
    setLoginStep("email");
    setHasPasskey(false);
    setPassword("");
    setError(null);
    setInfo(null);
  }

  return (
    <div className="auth-shell">
      <BackgroundAtmosphere variant="auth" />
      <aside className="auth-showcase reveal">
        <p className="eyebrow light">PayWhenDone</p>
        <h2 className="auth-showcase-title">
          {mode === "login"
            ? "Back to protected gigs."
            : "Escrow that checks the work."}
        </h2>
        <p className="auth-showcase-lede">
          Hold PayPal payment for cleaners, tutors, movers, and handymen hired
          off-platform — Muse AI confirms proof before money moves.
        </p>
        <div className="auth-pipeline" aria-hidden="true">
          <span>Hold</span>
          <i />
          <span>Prove</span>
          <i />
          <span>Verify</span>
          <i />
          <span className="accent">Pay</span>
        </div>
        <ul className="auth-highlights">
          <li>
            <strong>PayPal authorize</strong>
            <span>Funds held until the job checks out — not captured early.</span>
          </li>
          <li>
            <strong>Proof + Muse</strong>
            <span>Photos and notes matched against the written brief.</span>
          </li>
          <li>
            <strong>Release or void</strong>
            <span>Capture, payout, refund, or cancel from one workspace.</span>
          </li>
        </ul>
        <div className="auth-showcase-footer">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/templates">Templates</Link>
          <Link href="/about">About</Link>
        </div>
      </aside>

      <div className="auth-card panel reveal delay-1">
        <p className="eyebrow">
          {mode === "login" ? "Welcome back" : "Create account"}
        </p>
        <h1>{mode === "login" ? "Sign in" : "Join PayWhenDone"}</h1>
        <p className="muted auth-card-lede">
          {mode === "login"
            ? loginStep === "email"
              ? "Enter your email first. We’ll check for a passkey, then sign you in."
              : hasPasskey
                ? "This account has a passkey — use it, or fall back to password."
                : "No passkey yet. Sign in with password, then register one on Account."
            : "Create an account with email and password."}
        </p>

        {mode === "login" && loginStep === "email" ? (
          <form className="panel-form" onSubmit={onContinueEmail}>
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={busy !== null}
              />
            </label>
            {error ? <p className="error">{error}</p> : null}
            <button
              type="submit"
              className="btn-primary auth-submit"
              disabled={busy !== null}
            >
              {busy === "lookup" ? "Checking…" : "Continue"}
            </button>
          </form>
        ) : (
          <form className="panel-form" onSubmit={onSubmit}>
            {mode === "signup" ? (
              <label>
                Name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  required
                  disabled={busy !== null}
                />
              </label>
            ) : null}

            {mode === "login" ? (
              <div className="auth-email-chip">
                <span>{email}</span>
                <button type="button" onClick={changeEmail} disabled={busy !== null}>
                  Change
                </button>
              </div>
            ) : (
              <label>
                Email
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={busy !== null}
                />
              </label>
            )}

            {mode === "login" && hasPasskey ? (
              <>
                <button
                  type="button"
                  className="btn-primary auth-submit"
                  onClick={signInWithPasskey}
                  disabled={busy !== null}
                >
                  {busy === "passkey"
                    ? "Waiting for authenticator…"
                    : "Continue with passkey"}
                </button>
                <div className="auth-divider">
                  <span>or password</span>
                </div>
              </>
            ) : null}

            <label>
              Password
              <input
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                disabled={busy !== null}
              />
            </label>
            {mode === "signup" ? (
              <label>
                Confirm password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                  disabled={busy !== null}
                />
              </label>
            ) : null}

            {error ? <p className="error">{error}</p> : null}
            {info ? <p className="banner">{info}</p> : null}

            <button
              type="submit"
              className={
                mode === "login" && hasPasskey
                  ? "btn-ghost auth-submit"
                  : "btn-primary auth-submit"
              }
              disabled={busy !== null}
            >
              {busy === "form"
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in with password"
                  : "Create account"}
            </button>
          </form>
        )}

        <p className="auth-switch muted">
          {mode === "login" ? (
            <>
              New here? <Link href="/signup">Create an account</Link>
            </>
          ) : (
            <>
              Already have an account? <Link href="/login">Sign in</Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
