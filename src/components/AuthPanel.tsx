"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { authClient } from "@/lib/auth-client";

type Mode = "login" | "signup";

const highlights = [
  {
    title: "Hold with PayPal",
    body: "Authorize funds up front — nothing is captured until the job checks out.",
  },
  {
    title: "Prove the work",
    body: "Workers upload photos and notes against the written brief.",
  },
  {
    title: "Muse decides",
    body: "AI verifies proof, then you release, void, refund, or pay out.",
  },
];

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
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy("form");
    setError(null);
    setInfo(null);
    try {
      if (mode === "signup") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
        });
        if (err) throw new Error(err.message || "Sign up failed");
        setInfo("Account created. Optional: add a passkey on the next screen.");
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
      <div className="auth-atmosphere" aria-hidden="true" />

      <motion.aside
        className="auth-showcase"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="eyebrow light">PayWhenDone</p>
        <h2 className="auth-showcase-title">
          {mode === "login"
            ? "Back to protected gigs."
            : "Escrow that actually checks the work."}
        </h2>
        <p className="auth-showcase-lede">
          Hold PayPal payment for cleaners, tutors, movers, and handymen hired
          off-platform — Muse AI confirms the proof before money moves.
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
          {highlights.map((item, index) => (
            <motion.li
              key={item.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + index * 0.08, duration: 0.4 }}
            >
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </motion.li>
          ))}
        </ul>

        <div className="auth-showcase-footer">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/templates">Browse templates</Link>
        </div>
      </motion.aside>

      <motion.div
        className="auth-card panel"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="eyebrow">
          {mode === "login" ? "Welcome back" : "Create account"}
        </p>
        <h1>{mode === "login" ? "Sign in" : "Join PayWhenDone"}</h1>
        <p className="muted auth-card-lede">
          {mode === "login"
            ? "Use email and password. Passkeys are optional after you register one on Account."
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

          {error ? <p className="error">{error}</p> : null}
          {info ? <p className="banner">{info}</p> : null}

          <button
            type="submit"
            className="btn-primary auth-submit"
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
              <span>or passkey</span>
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
              <Link href="/account">Account</Link>. If the prompt hangs, cancel
              and use email.
            </p>
          </>
        ) : (
          <p className="muted auth-passkey-hint">
            After signup you can register a passkey for one-tap return visits.
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
      </motion.div>
    </div>
  );
}
