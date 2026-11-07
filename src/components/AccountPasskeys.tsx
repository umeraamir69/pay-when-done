"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";

type PasskeyRow = {
  id: string;
  name?: string | null;
  createdAt?: string | Date;
  deviceType?: string;
};

function AccountPasskeysInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setupPasskey = searchParams.get("setup") === "passkey";
  const { data: session, isPending } = useSession();
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
  const [name, setName] = useState("This device");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showSetupNudge, setShowSetupNudge] = useState(setupPasskey);

  async function refresh() {
    const { data, error: err } = await authClient.passkey.listUserPasskeys();
    if (err) {
      setError(err.message || "Could not list passkeys");
      return;
    }
    setPasskeys((data as PasskeyRow[]) || []);
  }

  useEffect(() => {
    if (session) refresh().catch(console.error);
  }, [session]);

  useEffect(() => {
    setShowSetupNudge(setupPasskey);
  }, [setupPasskey]);

  async function addPasskey() {
    setBusy(true);
    setError(null);
    setInfo(
      "Approve the browser / OS prompt (Face ID, Touch ID, or security key)…",
    );
    const timeoutMs = 45_000;
    const timeout = new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error("Passkey timed out")), timeoutMs);
    });
    try {
      const result = await Promise.race([
        authClient.passkey.addPasskey({
          name: name || "My passkey",
        }),
        timeout,
      ]);
      if (result?.error) {
        throw new Error(result.error.message || "Could not add passkey");
      }
      setInfo(
        "Passkey saved. Next visit: enter your email on login, then continue with passkey.",
      );
      setShowSetupNudge(false);
      if (setupPasskey) {
        router.replace("/account");
      }
      await refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Passkey registration failed";
      const lower = message.toLowerCase();
      if (
        lower.includes("abort") ||
        lower.includes("cancel") ||
        lower.includes("not allowed") ||
        lower.includes("timed out") ||
        lower.includes("timeout")
      ) {
        setError(
          "Passkey cancelled or timed out. Email/password still works — try again when ready.",
        );
      } else {
        setError(message);
      }
      setInfo(null);
    } finally {
      setBusy(false);
    }
  }

  async function removePasskey(id: string) {
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await authClient.passkey.deletePasskey({ id });
      if (err) throw new Error(err.message || "Delete failed");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  if (isPending) {
    return <p className="muted">Loading session…</p>;
  }

  if (!session) {
    return (
      <div className="panel">
        <p>Sign in to manage passkeys.</p>
        <a className="btn-primary" href="/login">
          Go to login
        </a>
      </div>
    );
  }

  const needsPasskey = showSetupNudge && passkeys.length === 0;

  return (
    <div className="account-grid">
      {needsPasskey ? (
        <p className="banner passkey-setup-banner" role="status">
          Finish setup: add a passkey now so next time you can enter your email
          and sign in with Face ID / Touch ID instead of a password.
        </p>
      ) : null}

      <article className="panel reveal">
        <h2>Profile</h2>
        <p>
          <strong>{session.user.name}</strong>
        </p>
        <p className="muted">{session.user.email}</p>
        <button type="button" className="btn-ghost" onClick={logout}>
          Sign out
        </button>
      </article>

      <article
        className={`panel reveal delay-1${needsPasskey ? " passkey-panel-highlight" : ""}`}
      >
        <h2>Passkeys</h2>
        <p className="muted">
          Optional. Add Face ID / Touch ID / Windows Hello here after you are
          signed in. Next visit, enter your email on login — if you have a
          passkey, you can use it instead of a password.
        </p>

        {error ? <p className="error">{error}</p> : null}
        {info ? <p className="banner">{info}</p> : null}

        <ul className="passkey-list">
          {passkeys.map((pk) => (
            <li key={pk.id}>
              <div>
                <strong>{pk.name || "Passkey"}</strong>
                <div className="muted">
                  {pk.deviceType || "device"} · {String(pk.createdAt || "")}
                </div>
              </div>
              <button
                type="button"
                className="btn-ghost"
                disabled={busy}
                onClick={() => removePasskey(pk.id)}
              >
                Remove
              </button>
            </li>
          ))}
          {!passkeys.length ? (
            <li className="muted">No passkeys yet — add one below.</li>
          ) : null}
        </ul>

        <label>
          Passkey nickname
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <button
          type="button"
          className="btn-primary"
          onClick={addPasskey}
          disabled={busy}
        >
          {busy ? "Waiting for authenticator…" : "Add passkey"}
        </button>
      </article>
    </div>
  );
}

export function AccountPasskeys() {
  return (
    <Suspense fallback={<p className="muted">Loading session…</p>}>
      <AccountPasskeysInner />
    </Suspense>
  );
}
