# Architecture

## High-level

```
User (passkey / email)
   └─ Better Auth session
        └─ Next.js App Router UI
             ├─ Prisma (Neon Postgres)
             ├─ PayPal sandbox APIs
             │    Orders → Authorize → Capture / Void
             │    Invoice · Payout · Refund · Webhooks
             └─ Muse Model API
                  proof image + notes vs brief → verdict
```

## Money state machine

1. `awaiting_payment` — job created  
2. `funded` — PayPal authorization held  
3. `proof_submitted` — worker evidence uploaded  
4. `ai_approved` / `ai_rejected` — Muse verdict  
5. `released` — capture (+ optional payout)  
6. `voided` / `refunded` / `disputed`

## Storage

- **Local:** Prisma + SQLite (`prisma/dev.db`)
- **Production:** Neon Postgres via Vercel Marketplace (`DATABASE_URL` + `DATABASE_URL_UNPOOLED`)
- Domain tables: `User`, `Session`, `Account`, `Passkey`, `Job`, `LedgerEntry`, `InvoiceRecord`, `PayoutRecord`, `WebhookEvent`

## Key modules

| File | Role |
|---|---|
| `src/lib/auth.ts` | Better Auth + passkey plugin |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/lib/store.ts` | Job / ledger / invoice / payout domain |
| `src/lib/paypal.ts` | PayPal REST wrappers |
| `src/lib/ai.ts` | Muse verifier (+ mock) |
| `src/middleware.ts` | Cookie session gate for protected routes |

## Auth flow

1. Sign up with email/password  
2. Register passkey on `/account`  
3. Later visits: `/login` → Continue with passkey  

## PayPal flow

1. `create-order` (intent AUTHORIZE)  
2. Buyer approves → `authorize` (hold)  
3. Optional invoice send  
4. After Muse approve → `release` (capture)  
5. Optional auto `payout` to worker  
6. Optional `refund` / `void`  
7. Webhooks land on `/api/webhooks/paypal` and append ledger + activity  
