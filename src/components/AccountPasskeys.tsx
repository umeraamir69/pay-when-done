"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import { AccountProfile } from "@/components/AccountProfile";

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
  const { data: session, isPending, refetch } = useSession();
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
  const [name, setName] = useState("This device");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const showSetupNudge = setupPasskey && !nudgeDismissed;
  const sessionUserId = session?.user?.id;

  async function refresh() {
    const { data, error: err } = await authClient.passkey.listUserPasskeys();
    if (err) {
      setError(err.message || "Could not list passkeys");
      return;
    }
    setPasskeys((data as PasskeyRow[]) || []);
  }

  useEffect(() => {
    if (!sessionUserId) return;
    let cancelled = false;
    authClient.passkey
      .listUserPasskeys()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message || "Could not list passkeys");
          return;
        }
        setPasskeys((data as PasskeyRow[]) || []);
      })
      .catch((err) => {
        if (!cancelled) console.error(err);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionUserId]);

  function dismissSetupNudge() {
    setNudgeDismissed(true);
    if (setupPasskey) {
      router.replace("/account");
    }
  }

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
      setInfo("Passkey saved. You can use it next time you sign in.");
      setNudgeDismissed(true);
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

  if (isPending) {
    return <p className="muted">Loading session…</p>;
  }

  if (!session) {
    return (
      <div className="panel">
        <p>Sign in to manage your account.</p>
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
        <div className="banner passkey-setup-banner" role="status">
          <div>
            <strong>Finish setup:</strong> add a passkey now so next time you
            can sign in with Face ID / Touch ID instead of a password. Optional
            — password still works if you skip.
          </div>
          <button
            type="button"
            className="btn-ghost passkey-setup-skip"
            onClick={dismissSetupNudge}
          >
            Not now
          </button>
        </div>
      ) : null}

      <AccountProfile
        user={session.user}
        onUpdated={async () => {
          await refetch();
        }}
      />

      <article
        className={`panel reveal delay-1 account-passkeys${needsPasskey ? " passkey-panel-highlight" : ""}`}
      >
        <h2>Passkeys</h2>
        <p className="muted">
          Optional Face ID / Touch ID / Windows Hello for faster return visits.
          Email and password still work.
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
