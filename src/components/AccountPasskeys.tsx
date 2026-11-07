"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";

type PasskeyRow = {
  id: string;
  name?: string | null;
  createdAt?: string | Date;
  deviceType?: string;
};

export function AccountPasskeys() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
  const [name, setName] = useState("MacBook / iPhone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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
    if (searchParams.get("nudge") === "passkey") {
      setInfo(
        "Enable passwordless: add a passkey below, then next visit use Continue with passkey on Sign in.",
      );
    }
  }, [searchParams]);

  async function addPasskey() {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const { error: err } = await authClient.passkey.addPasskey({
        name: name || "My passkey",
      });
      if (err) throw new Error(err.message || "Could not add passkey");
      setInfo("Passkey saved. Next visit you can sign in with it.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Passkey registration failed");
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

  return (
    <div className="account-grid">
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

      <article className="panel reveal delay-1">
        <h2>Passkeys</h2>
        <p className="muted">
          Passwordless for next time: register Face ID / Touch ID / Windows Hello
          here, then use Continue with passkey on Sign in.
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
