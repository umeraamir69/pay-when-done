"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

type Mode = "login" | "signup";

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
    return "Passkey cancelled or timed out. Sign in with email instead, then add a passkey from Account.";
  }
  if (lower.includes("credential") || lower.includes("no passkey")) {
    return "No passkey on this device yet. Sign in with email, open Account, then tap Add passkey.";
  }
  return `${raw}. Tip: use email first, then register a passkey on Account.`;
}

export function AuthPanel({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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
        setInfo("Account created. Optional: add a passkey from Account.");
        router.push("/account");
        router.refresh();
        return;
      }

      const { error: err } = await authClient.signIn.email({
        email,
        password,
      });
      if (err) throw new Error(err.message || "Sign in failed");
      router.push("/jobs");
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
    setInfo("Touch your security key / approve Face ID or Touch ID…");

    const timeoutMs = 45_000;
    const timeout = new Promise<never>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error("Passkey timed out"));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([
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

  return (
    <div className="auth-shell">
      <div className="auth-card panel reveal">
        <p className="eyebrow">
          {mode === "login" ? "Welcome back" : "Create account"}
        </p>
        <h1>{mode === "login" ? "Sign in" : "Sign up"}</h1>
        <p className="muted">
          {mode === "login"
            ? "Sign in with email and password. Passkey is only for return visits after you add one on Account."
            : "Create an account with email. Add Face ID / Touch ID later from Account if you want."}
        </p>

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
            className="btn-primary"
            disabled={busy !== null}
          >
            {busy === "form"
              ? "Please wait…"
              : mode === "login"
                ? "Sign in with email"
                : "Create account"}
          </button>
        </form>

        {mode === "login" ? (
          <>
            <div className="auth-divider">
              <span>or return with passkey</span>
            </div>
            <button
              type="button"
              className="btn-ghost auth-passkey"
              onClick={signInWithPasskey}
              disabled={busy !== null}
            >
              {busy === "passkey"
                ? "Waiting for authenticator… (cancel if stuck)"
                : "Continue with passkey"}
            </button>
            <p className="muted auth-passkey-hint">
              Only after you add a passkey on{" "}
              <Link href="/account">Account</Link>. New here? Use email first.
            </p>
          </>
        ) : (
          <p className="muted auth-passkey-hint">
            After signup, open Account to register a passkey for one-tap return
            visits. Passkeys are not created during signup.
          </p>
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
