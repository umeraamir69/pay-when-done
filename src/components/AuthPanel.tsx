"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

type Mode = "login" | "signup";

/** Only started after an explicit passkey click — never on mount. */
const PASSKEY_TIMEOUT_MS = 60_000;

function isAbortError(err: unknown) {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error &&
      (err.name === "AbortError" || /abort|cancel/i.test(err.message)))
  );
}

export function AuthPanel({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Passkey errors are isolated so email flow never inherits them. */
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const passkeyAttemptRef = useRef(0);
  const passkeyAbortRef = useRef<AbortController | null>(null);

  // Clear sticky error from prior visits / remounts. Never start WebAuthn here.
  useEffect(() => {
    mountedRef.current = true;
    setError(null);
    setPasskeyError(null);
    setBusy(null);

    return () => {
      mountedRef.current = false;
      passkeyAttemptRef.current += 1;
      passkeyAbortRef.current?.abort();
      passkeyAbortRef.current = null;
    };
  }, []);

  function abortPasskeyAttempt() {
    passkeyAttemptRef.current += 1;
    passkeyAbortRef.current?.abort();
    passkeyAbortRef.current = null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    abortPasskeyAttempt();
    setBusy("form");
    setError(null);
    setPasskeyError(null);

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match");
      setBusy(null);
      return;
    }

    try {
      if (mode === "signup") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
        });
        if (err) throw new Error(err.message || "Sign up failed");
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
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      if (mountedRef.current) setBusy(null);
    }
  }

  async function signInWithPasskey() {
    const attemptId = passkeyAttemptRef.current + 1;
    passkeyAttemptRef.current = attemptId;
    passkeyAbortRef.current?.abort();

    const ac = new AbortController();
    passkeyAbortRef.current = ac;

    setBusy("passkey");
    setError(null);
    setPasskeyError(null);

    const timeoutId = window.setTimeout(() => {
      ac.abort();
    }, PASSKEY_TIMEOUT_MS);

    const stillCurrent = () =>
      mountedRef.current && passkeyAttemptRef.current === attemptId;

    try {
      const passkeyPromise = authClient.signIn.passkey({
        // Explicit modal ceremony only — no conditional / autofill WebAuthn.
        autoFill: false,
      });

      const abortPromise = new Promise<never>((_, reject) => {
        const onAbort = () =>
          reject(new DOMException("Passkey aborted", "AbortError"));
        if (ac.signal.aborted) {
          onAbort();
          return;
        }
        ac.signal.addEventListener("abort", onAbort, { once: true });
      });

      const { error: err } = await Promise.race([
        passkeyPromise,
        abortPromise,
      ]);

      if (!stillCurrent()) return;

      if (err) {
        setPasskeyError(err.message || "Passkey sign-in failed");
        return;
      }

      router.push("/jobs");
      router.refresh();
    } catch (err) {
      if (!stillCurrent()) return;

      if (isAbortError(err) || ac.signal.aborted) {
        setPasskeyError("Passkey cancelled or timed out");
        return;
      }

      setPasskeyError(
        err instanceof Error ? err.message : "Passkey sign-in failed",
      );
    } finally {
      window.clearTimeout(timeoutId);
      if (passkeyAbortRef.current === ac) {
        passkeyAbortRef.current = null;
      }
      if (stillCurrent()) setBusy(null);
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
            ? "Enter your email and password to continue."
            : "Create an account with email and password."}
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

          <button
            type="submit"
            className="btn-primary"
            disabled={busy !== null}
          >
            {busy === "form"
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        {mode === "login" ? (
          <>
            <div className="auth-divider">
              <span>or</span>
            </div>
            <button
              type="button"
              className="btn-ghost auth-passkey"
              onClick={signInWithPasskey}
              disabled={busy !== null}
            >
              {busy === "passkey"
                ? "Waiting for authenticator…"
                : "Sign in with passkey"}
            </button>
            {passkeyError ? <p className="error">{passkeyError}</p> : null}
          </>
        ) : null}

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
