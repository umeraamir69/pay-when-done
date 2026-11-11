/**
 * PayPal Developer Platform integrations used by PayWhenDone:
 * - OAuth2
 * - Orders v2 (create / get / authorize)
 * - Payments (capture / void authorization, refund capture)
 * - Invoicing v2 (draft + send)
 * - Payouts v1 (pay worker after release)
 */

import { isSyntheticPayPalId } from "./paypal-demo-ids";

type PayPalToken = { access_token: string; expires_in: number };

let cachedToken: { token: string; expiresAt: number } | null = null;

export function isPayPalMock() {
  if (process.env.PAYPAL_MOCK === "true") return true;
  return !(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

/**
 * Mock when PAYPAL_MOCK / missing keys, or when the resource id is seed/demo
 * shaped. Real sandbox authorize→capture IDs from checkout never match.
 */
export function shouldMockPayPalId(id?: string | null): boolean {
  return isPayPalMock() || isSyntheticPayPalId(id);
}

export { isSyntheticPayPalId, isPitchSeedJob } from "./paypal-demo-ids";

function apiBase() {
  return process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
}

export function getPublicClientId() {
  if (isPayPalMock()) return "mock";
  return (
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
    process.env.PAYPAL_CLIENT_ID ||
    "mock"
  );
}

async function getAccessToken(): Promise<string> {
  if (isPayPalMock()) return "mock-token";

  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as PayPalToken;
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

async function paypalFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
  });

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(
      `PayPal ${path} failed: ${res.status} ${JSON.stringify(body)}`,
    );
  }
  return body;
}

function requestId() {
  return `pwd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ─── Orders ─────────────────────────────────────────────── */

export async function createAuthorizationOrder(params: {
  amount: number;
  currency: string;
  jobId: string;
  description: string;
}) {
  if (isPayPalMock()) {
    return {
      id: `MOCK-ORDER-${params.jobId.slice(0, 8)}`,
      status: "CREATED",
      mock: true,
    };
  }

  return paypalFetch("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "AUTHORIZE",
      purchase_units: [
        {
          reference_id: params.jobId.slice(0, 256),
          description: params.description.slice(0, 127),
          custom_id: params.jobId.slice(0, 127),
          soft_descriptor: "PAYWHENDONE",
          amount: {
            currency_code: params.currency,
            value: params.amount.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: "PayWhenDone",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
      },
    }),
  });
}

export async function getOrder(orderId: string) {
  if (shouldMockPayPalId(orderId)) {
    return {
      id: orderId,
      status: "COMPLETED",
      intent: "AUTHORIZE",
      mock: true,
    };
  }
  return paypalFetch(`/v2/checkout/orders/${orderId}`);
}

export async function authorizeOrder(orderId: string) {
  if (shouldMockPayPalId(orderId)) {
    return {
      id: orderId,
      status: "COMPLETED",
      purchase_units: [
        {
          payments: {
            authorizations: [
              {
                id: `MOCK-AUTH-${orderId.slice(-8)}`,
                status: "CREATED",
              },
            ],
          },
        },
      ],
      mock: true,
    };
  }

  return paypalFetch(`/v2/checkout/orders/${orderId}/authorize`, {
    method: "POST",
    body: "{}",
  });
}

export function extractAuthorizationId(authorizeResponse: {
  purchase_units?: Array<{
    payments?: {
      authorizations?: Array<{ id: string; status?: string }>;
    };
  }>;
}): string | undefined {
  return authorizeResponse.purchase_units?.[0]?.payments?.authorizations?.[0]
    ?.id;
}

export async function getAuthorization(authorizationId: string) {
  if (shouldMockPayPalId(authorizationId)) {
    return {
      id: authorizationId,
      status: "CREATED",
      mock: true,
    };
  }
  return paypalFetch(`/v2/payments/authorizations/${authorizationId}`);
}

export async function captureAuthorization(authorizationId: string) {
  if (shouldMockPayPalId(authorizationId)) {
    return {
      id: `MOCK-CAPTURE-${authorizationId.slice(-8)}`,
      status: "COMPLETED",
      mock: true,
    };
  }

  return paypalFetch(`/v2/payments/authorizations/${authorizationId}/capture`, {
    method: "POST",
    headers: { "PayPal-Request-Id": requestId() },
    body: JSON.stringify({ final_capture: true }),
  });
}

export async function voidAuthorization(authorizationId: string) {
  if (shouldMockPayPalId(authorizationId)) {
    return { id: authorizationId, status: "VOIDED", mock: true };
  }

  return paypalFetch(`/v2/payments/authorizations/${authorizationId}/void`, {
    method: "POST",
    body: "{}",
  });
}

export async function getCapture(captureId: string) {
  if (shouldMockPayPalId(captureId)) {
    return { id: captureId, status: "COMPLETED", mock: true };
  }
  return paypalFetch(`/v2/payments/captures/${captureId}`);
}

export async function refundCapture(params: {
  captureId: string;
  amount: number;
  currency: string;
  note?: string;
}) {
  if (shouldMockPayPalId(params.captureId)) {
    return {
      id: `MOCK-REFUND-${params.captureId.slice(-8)}`,
      status: "COMPLETED",
      mock: true,
    };
  }

  return paypalFetch(`/v2/payments/captures/${params.captureId}/refund`, {
    method: "POST",
    headers: { "PayPal-Request-Id": requestId() },
    body: JSON.stringify({
      amount: {
        value: params.amount.toFixed(2),
        currency_code: params.currency,
      },
      note_to_payer: params.note || "PayWhenDone refund",
    }),
  });
}

/* ─── Invoicing ──────────────────────────────────────────── */

export async function createAndSendInvoice(params: {
  jobId: string;
  title: string;
  amount: number;
  currency: string;
  clientName: string;
  /** Invoices typically go to the payer/client */
  recipientEmail: string;
  workerName: string;
  /** Force mock (e.g. pitch-seed jobs) while live keys remain configured. */
  forceMock?: boolean;
}) {
  if (isPayPalMock() || params.forceMock) {
    return {
      id: `MOCK-INV-${params.jobId.slice(0, 8)}`,
      status: "SENT",
      href: `https://www.sandbox.paypal.com/invoice/p/#MOCK-INV-${params.jobId.slice(0, 8)}`,
      mock: true,
    };
  }

  const draft = await paypalFetch("/v2/invoicing/invoices", {
    method: "POST",
    headers: { "PayPal-Request-Id": requestId() },
    body: JSON.stringify({
      detail: {
        invoice_number: `PWD-${params.jobId.slice(0, 8).toUpperCase()}`,
        currency_code: params.currency,
        note: `PayWhenDone escrow for: ${params.title}`,
        terms_and_conditions:
          "Funds held until AI-verified completion of the job brief.",
        memo: `Job ${params.jobId}`,
      },
      invoicer: {
        name: { given_name: "PayWhenDone", surname: "Escrow" },
      },
      primary_recipients: [
        {
          billing_info: {
            name: {
              given_name: params.clientName.split(" ")[0] || params.clientName,
              surname: params.clientName.split(" ").slice(1).join(" ") || "Client",
            },
            email_address: params.recipientEmail,
          },
        },
      ],
      items: [
        {
          name: params.title.slice(0, 120),
          description: `Work by ${params.workerName}`,
          quantity: "1",
          unit_amount: {
            currency_code: params.currency,
            value: params.amount.toFixed(2),
          },
          unit_of_measure: "AMOUNT",
        },
      ],
    }),
  });

  const invoiceId = draft.id as string;
  await paypalFetch(`/v2/invoicing/invoices/${invoiceId}/send`, {
    method: "POST",
    body: JSON.stringify({ send_to_recipient: true }),
  });

  return {
    id: invoiceId,
    status: "SENT",
    href: draft.href,
    mock: false,
    detail: draft,
  };
}

/* ─── Payouts ────────────────────────────────────────────── */

export async function createWorkerPayout(params: {
  jobId: string;
  amount: number;
  currency: string;
  receiverEmail: string;
  note?: string;
  /** Force mock (e.g. pitch-seed jobs) while live keys remain configured. */
  forceMock?: boolean;
}) {
  if (isPayPalMock() || params.forceMock) {
    return {
      batch_header: {
        payout_batch_id: `MOCK-PAYOUT-${params.jobId.slice(0, 8)}`,
        batch_status: "SUCCESS",
      },
      items: [
        {
          payout_item_id: `MOCK-PITEM-${params.jobId.slice(0, 8)}`,
          transaction_status: "SUCCESS",
        },
      ],
      mock: true,
    };
  }

  return paypalFetch("/v1/payments/payouts", {
    method: "POST",
    headers: { "PayPal-Request-Id": requestId() },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: `pwd-${params.jobId.slice(0, 18)}-${Date.now()}`,
        email_subject: "You were paid via PayWhenDone",
        email_message:
          "Your gig was verified and payment was released through PayWhenDone.",
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: {
            value: params.amount.toFixed(2),
            currency: params.currency,
          },
          note: params.note || `PayWhenDone payout for job ${params.jobId}`,
          receiver: params.receiverEmail,
          sender_item_id: params.jobId.slice(0, 30),
        },
      ],
    }),
  });
}

export async function getPayoutBatch(batchId: string) {
  if (shouldMockPayPalId(batchId)) {
    return {
      batch_header: {
        payout_batch_id: batchId,
        batch_status: "SUCCESS",
      },
      mock: true,
    };
  }
  return paypalFetch(`/v1/payments/payouts/${batchId}`);
}

/* ─── Sync helpers ───────────────────────────────────────── */

export async function syncJobPayPalState(params: {
  orderId?: string;
  authorizationId?: string;
  captureId?: string;
}) {
  const snapshot: Record<string, unknown> = {
    syncedAt: new Date().toISOString(),
  };

  if (params.orderId) {
    const order = await getOrder(params.orderId);
    snapshot.orderId = order.id;
    snapshot.orderStatus = order.status;
    snapshot.rawOrder = order;
  }
  if (params.authorizationId) {
    const auth = await getAuthorization(params.authorizationId);
    snapshot.authorizationId = auth.id;
    snapshot.authorizationStatus = auth.status;
    snapshot.rawAuth = auth;
  }
  if (params.captureId) {
    const capture = await getCapture(params.captureId);
    snapshot.captureId = capture.id;
    snapshot.captureStatus = capture.status;
    snapshot.rawCapture = capture;
  }

  return snapshot;
}

/* ─── Webhook signature verification ─────────────────────── */

export type WebhookVerifyResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

/**
 * Verify a PayPal webhook using transmission headers + webhook id.
 * Fail closed unless PAYPAL_WEBHOOK_ALLOW_UNSIGNED=true (local only).
 */
export async function verifyPayPalWebhook(
  request: Request,
  rawBody: string,
): Promise<WebhookVerifyResult> {
  const allowUnsigned =
    process.env.PAYPAL_WEBHOOK_ALLOW_UNSIGNED === "true" &&
    process.env.VERCEL !== "1";

  if (isPayPalMock() || allowUnsigned) {
    return { ok: true };
  }

  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  if (!webhookId) {
    return {
      ok: false,
      status: 503,
      error: "Webhook verification is not configured",
    };
  }

  const authAlgo = request.headers.get("paypal-auth-algo");
  const certUrl = request.headers.get("paypal-cert-url");
  const transmissionId = request.headers.get("paypal-transmission-id");
  const transmissionSig = request.headers.get("paypal-transmission-sig");
  const transmissionTime = request.headers.get("paypal-transmission-time");

  if (
    !authAlgo ||
    !certUrl ||
    !transmissionId ||
    !transmissionSig ||
    !transmissionTime
  ) {
    return { ok: false, status: 401, error: "Missing PayPal transmission headers" };
  }

  // Cert URL must be PayPal-owned — reject spoofed cert hosts.
  try {
    const host = new URL(certUrl).hostname.toLowerCase();
    if (
      host !== "api.paypal.com" &&
      host !== "api.sandbox.paypal.com" &&
      !host.endsWith(".paypal.com")
    ) {
      return { ok: false, status: 401, error: "Invalid certificate URL" };
    }
  } catch {
    return { ok: false, status: 401, error: "Invalid certificate URL" };
  }

  let webhookEvent: unknown;
  try {
    webhookEvent = JSON.parse(rawBody);
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON body" };
  }

  try {
    const result = await paypalFetch("/v1/notifications/verify-webhook-signature", {
      method: "POST",
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: webhookEvent,
      }),
    });

    if (result?.verification_status !== "SUCCESS") {
      return { ok: false, status: 401, error: "Signature verification failed" };
    }
    return { ok: true };
  } catch (error) {
    console.error("paypal_webhook_verify_failed", error);
    return { ok: false, status: 401, error: "Signature verification failed" };
  }
}
