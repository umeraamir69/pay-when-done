"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

type Mode = "login" | "signup";

/** Explicit click ceremony only — never start WebAuthn on mount. */
const PASSKEY_TIMEOUT_MS = 60_000;

function isAbortError(err: unknown) {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error &&
      (err.name === "AbortError" ||
        /abort|cancel|timed?\s*out/i.test(err.message)))
  );
}

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
    return "Passkey cancelled or timed out. Sign in with email, then add a passkey from Account.";
  }
  if (lower.includes("credential") || lower.includes("no passkey")) {
    return "No passkey on this device yet. Sign in with email, open Account, then tap Add passkey.";
  }
  return `${raw}. Tip: use email first, then register a passkey on Account.`;
}

export function AuthPanel({
  mode,
  emailAuthEnabled = false,
}: {
  mode: Mode;
  /** True only when RESEND_API_KEY is configured server-side. */
  emailAuthEnabled?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  /** Isolated so email form never inherits a sticky WebAuthn failure. */
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [magicInfo, setMagicInfo] = useState<string | null>(null);
  const [magicError, setMagicError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const passkeyAttemptRef = useRef(0);
  const passkeyAbortRef = useRef<AbortController | null>(null);

  // Clear sticky state on mount. Never start WebAuthn / autofill here.
  useEffect(() => {
    mountedRef.current = true;
    setError(null);
    setInfo(null);
    setPasskeyError(null);
    setMagicInfo(null);
    setMagicError(null);
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
    setMagicError(null);
    setMagicInfo(null);
    setInfo(null);
    try {
      if (mode === "signup") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
        });
        if (err) throw new Error(err.message || "Sign up failed");
        setInfo(
          "Account created. Add a passkey on the next screen for passwordless sign-in next time.",
        );
        router.push("/account?nudge=passkey");
        router.refresh();
        return;
      }

      const { error: err } = await authClient.signIn.email({
        email,
        password,
      });
      if (err) throw new Error(err.message || "Sign in failed");
      router.push("/account?nudge=passkey");
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
    setMagicError(null);
    setInfo(null);

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
        setPasskeyError(passkeyErrorMessage(err));
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      if (!stillCurrent()) return;

      if (isAbortError(err) || ac.signal.aborted) {
        setPasskeyError(
          "Passkey cancelled or timed out. Sign in with email instead, then add a passkey from Account.",
        );
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

  async function sendMagicLink() {
    if (!emailAuthEnabled) return;
    const trimmed = email.trim();
    if (!trimmed) {
      setMagicError("Enter your email above, then request a sign-in link.");
      return;
    }

    abortPasskeyAttempt();
    setBusy("magic");
    setMagicError(null);
    setMagicInfo(null);
    setPasskeyError(null);
    setError(null);

    try {
      const { error: err } = await authClient.signIn.magicLink({
        email: trimmed,
        callbackURL: "/admin",
        errorCallbackURL: "/login?magic=error",
      });
      if (err) throw new Error(err.message || "Could not send sign-in link");
      setMagicInfo(
        "Check your inbox for a sign-in link. It expires in a few minutes.",
      );
    } catch (err) {
      if (!mountedRef.current) return;
      setMagicError(
        err instanceof Error
          ? err.message
          : "Could not send sign-in link. Try passkey or email + password.",
      );
    } finally {
      if (mountedRef.current) setBusy(null);
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
            ? "Passwordless with a passkey, or use email and password."
            : "Create an account with email and password. After signup, add a passkey for one-tap return visits."}
        </p>

        {mode === "login" ? (
          <section
            className="auth-passwordless"
            aria-labelledby="passwordless-heading"
          >
            <h2 id="passwordless-heading" className="auth-section-title">
              Passwordless (passkey)
            </h2>
            <p className="muted auth-passkey-hint">
              Face ID, Touch ID, or Windows Hello — only after you register a
              passkey on <Link href="/account">Account</Link>.
            </p>
            <button
              type="button"
              className="btn-primary auth-passkey"
              onClick={signInWithPasskey}
              disabled={busy !== null}
            >
              {busy === "passkey"
                ? "Waiting for authenticator… (cancel if stuck)"
                : "Continue with passkey"}
            </button>
            {passkeyError ? <p className="error">{passkeyError}</p> : null}

            {emailAuthEnabled ? (
              <div className="auth-magic">
                <p className="muted auth-passkey-hint">
                  Or email yourself a one-time sign-in link (uses the email
                  field below).
                </p>
                <button
                  type="button"
                  className="btn-ghost auth-passkey"
                  onClick={sendMagicLink}
                  disabled={busy !== null}
                >
                  {busy === "magic"
                    ? "Sending link…"
                    : "Email me a sign-in link"}
                </button>
                {magicError ? <p className="error">{magicError}</p> : null}
                {magicInfo ? <p className="banner">{magicInfo}</p> : null}
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="auth-divider">
          <span>
            {mode === "login" ? "or email & password" : "email & password"}
          </span>
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
              required={mode === "signup" || busy === "form"}
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

        {mode === "signup" ? (
          <p className="muted auth-passkey-hint">
            After you create an account you will land on Account — add a passkey
            there for passwordless sign-in next time.
          </p>
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
