"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

type Mode = "login" | "signup";
/** Login: email → then password and/or passkey depending on account */
type LoginStep = "email" | "auth";

/** Only started after an explicit passkey click — never on mount. */
const PASSKEY_TIMEOUT_MS = 60_000;

function isAbortError(err: unknown) {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error &&
      (err.name === "AbortError" || /abort|cancel/i.test(err.message)))
  );
}

function passkeyErrorMessage(err: unknown) {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Passkey sign-in failed";
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
  return raw || "Passkey sign-in failed";
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
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const passkeyAttemptRef = useRef(0);
  const passkeyAbortRef = useRef<AbortController | null>(null);

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
    abortPasskeyAttempt();
    setError(null);
    setPasskeyError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setError("Enter a valid email to continue.");
      return;
    }
    setBusy("lookup");
    try {
      const found = await checkPasskeyStatus(trimmed);
      if (!mountedRef.current) return;
      setEmail(trimmed);
      setHasPasskey(found);
      setLoginStep("auth");
    } catch {
      if (!mountedRef.current) return;
      setHasPasskey(false);
      setLoginStep("auth");
    } finally {
      if (mountedRef.current) setBusy(null);
    }
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
        router.push("/account?setup=passkey");
        router.refresh();
        return;
      }

      const { error: err } = await authClient.signIn.email({
        email,
        password,
      });
      if (err) throw new Error(err.message || "Sign in failed");
      router.push(hasPasskey ? "/jobs" : "/account?setup=passkey");
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
        setPasskeyError(passkeyErrorMessage(err.message || err));
        return;
      }

      router.push("/jobs");
      router.refresh();
    } catch (err) {
      if (!stillCurrent()) return;

      if (isAbortError(err) || ac.signal.aborted) {
        setPasskeyError("Passkey cancelled or timed out. Use your password instead.");
        return;
      }

      setPasskeyError(passkeyErrorMessage(err));
    } finally {
      window.clearTimeout(timeoutId);
      if (passkeyAbortRef.current === ac) {
        passkeyAbortRef.current = null;
      }
      if (stillCurrent()) setBusy(null);
    }
  }

  function changeEmail() {
    abortPasskeyAttempt();
    setLoginStep("email");
    setHasPasskey(false);
    setPassword("");
    setError(null);
    setPasskeyError(null);
  }

  const loginEmailStep = mode === "login" && loginStep === "email";

  return (
    <div className="auth-shell">
      <div className="auth-card panel reveal">
        <p className="eyebrow">
          {mode === "login" ? "Welcome back" : "Create account"}
        </p>
        <h1>{mode === "login" ? "Sign in" : "Sign up"}</h1>
        <p className="muted">
          {mode === "login"
            ? loginEmailStep
              ? "Enter your email to continue."
              : hasPasskey
                ? "Use your passkey, or sign in with password."
                : "Enter your password to continue."
            : "Create an account with email and password."}
        </p>

        {loginEmailStep ? (
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
                autoFocus
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
                <button
                  type="button"
                  onClick={changeEmail}
                  disabled={busy !== null}
                >
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
                {passkeyError ? <p className="error">{passkeyError}</p> : null}
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
                autoFocus={mode === "login" && !hasPasskey}
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
