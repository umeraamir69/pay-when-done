"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BackgroundAtmosphere } from "@/components/BackgroundAtmosphere";
import { authClient } from "@/lib/auth-client";

type Mode = "login" | "signup";

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
        setInfo("Account created. Register a passkey next for one-tap login.");
        router.push("/account");
        router.refresh();
        return;
      }

      const { error: err } = await authClient.signIn.email({
        email,
        password,
      });
      if (err) throw new Error(err.message || "Sign in failed");
      router.push("/admin");
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
    try {
      const { error: err } = await authClient.signIn.passkey({
        autoFill: true,
      });
      if (err) throw new Error(err.message || "Passkey sign-in failed");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Passkey failed — register one from Account after email login",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="auth-shell">
      <BackgroundAtmosphere variant="auth" />
      <div className="auth-card panel reveal">
        <p className="eyebrow">
          {mode === "login" ? "Welcome back" : "Create account"}
        </p>
        <h1>{mode === "login" ? "Sign in" : "Sign up"}</h1>
        <p className="muted">
          Use email once, then register a passkey (Touch ID / Face ID / Windows
          Hello) for passwordless login every time.
        </p>

        <button
          type="button"
          className="btn-primary auth-passkey"
          onClick={signInWithPasskey}
          disabled={busy !== null}
        >
          {busy === "passkey" ? "Waiting for passkey…" : "Continue with passkey"}
        </button>

        <div className="auth-divider">
          <span>or email</span>
        </div>

        <form className="panel-form" onSubmit={onSubmit}>
          {mode === "signup" ? (
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                required
              />
            </label>
          ) : null}
          <label>
            Email
            <input
              type="email"
              autoComplete="username webauthn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            />
          </label>

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
