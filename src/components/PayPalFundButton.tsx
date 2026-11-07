"use client";

import {
  PayPalButtons,
  PayPalScriptProvider,
} from "@paypal/react-paypal-js";
import { useEffect, useState } from "react";
import type { Job } from "@/lib/types";
import { withTopProgress } from "@/lib/top-progress";
import { BusySpinner } from "@/components/TableControls";

type Props = {
  job: Job;
  onFunded: (job: Job) => void;
};

export function PayPalFundButton({ job, onFunded }: Props) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [mock, setMock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/paypal/config")
      .then((r) => r.json())
      .then((data) => {
        setClientId(data.clientId);
        setMock(Boolean(data.mock));
      })
      .catch(() => setError("Could not load PayPal config"));
  }, []);

  async function fundWithMock() {
    setBusy(true);
    setError(null);
    try {
      await withTopProgress(async () => {
        const createRes = await fetch(`/api/jobs/${job.id}/create-order`, {
          method: "POST",
        });
        const createData = await createRes.json();
        if (!createRes.ok) throw new Error(createData.error || "Order failed");

        const authRes = await fetch(`/api/jobs/${job.id}/authorize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: createData.orderId }),
        });
        const authData = await authRes.json();
        if (!authRes.ok) throw new Error(authData.error || "Authorize failed");
        onFunded(authData.job);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mock funding failed");
    } finally {
      setBusy(false);
    }
  }

  if (!clientId) {
    return <p className="muted">Loading PayPal…</p>;
  }

  if (mock || clientId === "mock") {
    return (
      <div className="fund-box">
        <p className="mock-badge">Sandbox mock mode</p>
        <p className="muted">
          No PayPal credentials detected. Simulate an authorization hold so you
          can keep demoing Muse verification. Add sandbox keys in{" "}
          <code>.env.local</code> for real PayPal buttons.
        </p>
        {error ? <p className="error">{error}</p> : null}
        <button
          type="button"
          className="btn-primary"
          onClick={fundWithMock}
          disabled={busy}
        >
          {busy ? (
            <BusySpinner label="Holding funds…" />
          ) : (
            `Hold ${job.amount} ${job.currency} (mock)`
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fund-box">
      <p className="muted">
        Client pays now. PayPal <strong>authorizes</strong> (holds) the money —
        it is only captured after AI approves the proof.
      </p>
      {error ? <p className="error">{error}</p> : null}
      <PayPalScriptProvider
        options={{
          clientId,
          currency: job.currency,
          intent: "authorize",
          components: "buttons",
        }}
      >
        <PayPalButtons
          style={{ layout: "vertical", shape: "rect", label: "pay" }}
          createOrder={async () => {
            const res = await fetch(`/api/jobs/${job.id}/create-order`, {
              method: "POST",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "create order failed");
            return data.orderId as string;
          }}
          onApprove={async (data) => {
            const res = await fetch(`/api/jobs/${job.id}/authorize`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: data.orderID }),
            });
            const json = await res.json();
            if (!res.ok) {
              setError(json.error || "Authorization failed");
              return;
            }
            onFunded(json.job);
          }}
          onError={(err) => {
            console.error(err);
            setError("PayPal checkout error. Check sandbox app credentials.");
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
