# API reference

Base URL (local): `http://localhost:3000`  
Production: `https://pay-when-done.vercel.app`

**Interactive docs:** [/docs/swagger](https://pay-when-done.vercel.app/docs/swagger)  
**OpenAPI JSON:** [/api/openapi](https://pay-when-done.vercel.app/api/openapi)

## Health & auth

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Service + DB health |
| GET | `/api/openapi` | OpenAPI 3.1 JSON (Swagger) |
| * | `/api/auth/*` | Better Auth (email + passkeys) |

## Jobs

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/jobs` | List/filter (`?status=&q=&category=`) |
| POST | `/api/jobs` | Create escrow job |
| GET | `/api/jobs/export` | CSV export |
| GET | `/api/jobs/:id` | Fetch one job |
| POST | `/api/jobs/:id/create-order` | PayPal create AUTHORIZE order |
| POST | `/api/jobs/:id/authorize` | Authorize hold (+ optional invoice) |
| POST | `/api/jobs/:id/proof` | Upload worker proof |
| POST | `/api/jobs/:id/verify` | Muse AI verification |
| POST | `/api/jobs/:id/release` | Capture (+ optional payout) |
| POST | `/api/jobs/:id/void` | Void authorization |
| POST | `/api/jobs/:id/refund` | Refund capture |
| POST | `/api/jobs/:id/invoice` | Create & send invoice |
| POST | `/api/jobs/:id/payout` | Payout to worker |
| POST | `/api/jobs/:id/sync` | Sync PayPal state |
| POST | `/api/jobs/:id/dispute` | Dispute message |
| POST/PATCH | `/api/jobs/:id/milestones` | Add/update milestones |
| POST | `/api/jobs/:id/notes` | Internal admin notes |
| POST | `/api/jobs/:id/duplicate` | Clone job |
| POST | `/api/jobs/:id/rate` | Rate worker 1–5 |

## PayPal / admin / notifications

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/paypal/config` | Client id + mock flag |
| POST | `/api/webhooks/paypal` | Webhook ingest |
| GET | `/api/admin/stats` | Dashboard KPIs |
| GET | `/api/admin/ledger` | Ledger / invoices / payouts / webhooks |
| POST | `/api/admin/seed` | Demo dataset |
| GET | `/api/notifications` | Activity-derived feed |

## Example: create job

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H 'Content-Type: application/json' \
  -d '{
    "title":"Bathroom clean",
    "brief":"Clean shower and floor. Photos required.",
    "amount":85,
    "clientName":"Alex",
    "workerName":"Jordan",
    "workerEmail":"jordan@example.com"
  }'
```

## Example: health

```bash
curl http://localhost:3000/api/health
```
