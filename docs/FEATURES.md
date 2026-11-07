# PayWhenDone — Feature catalog

Complete list of shipped features for builders and hackathon judges.

## Escrow core

- Create escrow jobs with brief, amount, category, priority, tags
- Job templates (cleaning, moving, tutoring, handyman, creative, lawn)
- PayPal AUTHORIZE hold (funds reserved, not captured)
- Worker proof upload (photo + notes)
- Muse AI verification (approve / reject + confidence + matched/missing)
- Capture release or void hold
- Duplicate job
- Worker rating 1–5 after release
- Public receipt page per job (`/receipt/[id]`)

## PayPal developer platform

- OAuth2 client credentials
- Orders v2 create / get / authorize
- Payments capture / void authorization
- Refunds on captured payments
- Invoicing v2 create + send
- Payouts v1 to worker email
- Sync order / authorization / capture status
- Webhook receiver at `/api/webhooks/paypal`
- Mock mode when sandbox keys are absent
- Auto-payout on release toggle
- Invoice-on-fund toggle

## AI

- Meta Muse Spark via Model API
- Vision + text brief matching
- Deterministic mock verifier fallback
- Verdict stored on job with provider stamp

## Auth & security

- Better Auth email/password signup & login
- Passkey registration (Touch ID / Face ID / Windows Hello)
- Passkey sign-in on every visit
- Protected routes: admin, jobs, create, settings, account, notifications
- Session-aware header + account page

## Data & ops

- Prisma + SQLite durable database
- Postgres-ready schema for Neon/Supabase
- Jobs, ledger, invoices, payouts, webhooks tables
- Admin dashboard KPIs + pipeline + activity
- PayPal ledger table in admin
- CSV export of all jobs (`/api/jobs/export`)
- Demo data seeder
- Health check endpoint (`/api/health`)
- Internal admin notes per job
- Milestones with status updates
- Dispute thread (client / worker / admin)
- Activity timeline
- Notifications feed from activity

## Product UX

- Marketing landing with Framer Motion
- How it works + FAQ
- In-app docs hub (`/docs`, features, architecture, API)
- Templates gallery (`/templates`)
- Settings / env health
- Responsive layout

## In-app docs

| Path | Content |
|---|---|
| `/docs` | Docs home |
| `/docs/features` | This catalog in the UI |
| `/docs/architecture` | System diagram + state machine |
| `/docs/api` | REST endpoint table |
