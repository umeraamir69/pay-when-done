# PayWhenDone

**AI-verified escrow for off-platform local gigs** — built for the [PayPal AI Hackathon](https://paypalaihackathon.devpost.com/).

Clients hire cleaners, tutors, movers, and handymen on Facebook / Nextdoor / WhatsApp with zero protection. PayWhenDone holds a PayPal authorization until Muse AI verifies the worker’s proof against the job brief, then **captures** or **voids** the payment — with optional invoice + worker payout.

## Live demo (judges)

| | |
|---|---|
| **Hosted app** | https://pay-when-done.vercel.app |
| **Health** | https://pay-when-done.vercel.app/api/health |
| **Docs** | https://pay-when-done.vercel.app/docs (Swagger requires sign-in) |

**Judge path (≈ 3 min):**

1. Open the hosted app → **Sign up** (email + password)  
2. Optional: `/account` → add a **passkey**  
3. `/templates` or `/create` → create an escrow job  
4. Fund with **PayPal Sandbox** (sandbox buyer) or use mock if keys unset locally  
5. Submit proof photo + notes → **Verify with Muse**  
6. **Release** payment → open `/receipt/[id]` · check `/admin` ledger  

Sandbox buyer: create a **Personal** account in [PayPal Developer Sandbox](https://developer.paypal.com/dashboard/accounts).  
Business sandbox for this project is configured on the merchant app (**Hackathon**).

## Why this qualifies

| Requirement | How we meet it |
|---|---|
| PayPal (sandbox) | Orders **Authorize & Capture**, Invoices, Payouts, Refunds, Webhooks |
| AI (meaningful) | Muse vision + brief matching decides release vs hold |
| Working demo | Hosted on Vercel + local `npm run dev` |
| Real-world problem | Trust gap outside marketplace platforms |
| Agentic commerce | Agent gates a real money action |

## Stack

| Layer | Choice |
|---|---|
| **DB** | Prisma + Neon Postgres (Vercel Marketplace) |
| **Auth** | Better Auth (email+password; optional passkeys on Account) |
| **Payments** | PayPal sandbox REST APIs |
| **AI** | Meta Muse (`muse-spark-1.3`) |
| **UI** | Next.js App Router + Framer Motion |

## Docs (in repo + in app)

| Doc | Path |
|---|---|
| Feature catalog | [`docs/FEATURES.md`](docs/FEATURES.md) · `/docs/features` |
| Architecture | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · `/docs/architecture` |
| API reference | [`docs/API.md`](docs/API.md) · `/docs/api` · `/docs/swagger` (auth) |
| OpenAPI JSON | `/api/openapi` (auth) |
| Docs hub | `/docs` |

## Feature highlights

- Escrow: hold → proof → Muse verify → release / void / refund  
- PayPal: orders, authorize, capture, void, refund, invoice, payout, sync, webhooks  
- Auth: email signup + **passkey login**  
- Ops: admin dashboard, ledger, CSV export, notifications, health check  
- Product: templates, disputes, milestones, ratings, receipts, activity timeline  

Full list: [`docs/FEATURES.md`](docs/FEATURES.md)

## Quick start (local)

```bash
git clone https://github.com/umeraamir69/pay-when-done.git
cd pay-when-done
cp .env.example .env.local
# set MODEL_API_KEY, BETTER_AUTH_SECRET, PayPal sandbox keys (optional)
npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without PayPal keys → mock authorize/capture. Without Muse key → mock AI.

### Env

See [`.env.example`](.env.example). Required for real sandbox + Muse:

```env
DATABASE_URL="file:./dev.db"
BETTER_AUTH_SECRET=long-random-string
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
MODEL_API_KEY=LLM_...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
PAYPAL_MOCK=false
# After creating a webhook pointing at your public URL:
# PAYPAL_WEBHOOK_ID=...
```

## Demo script (≤ 3 minutes — for YouTube)

1. Landing → problem (off-platform gigs, no escrow)  
2. Create job from a template  
3. Hold funds (PayPal sandbox AUTHORIZE)  
4. Submit proof photo + notes  
5. Muse verifies against brief  
6. Release → capture (+ optional payout) · show receipt / admin ledger  

## App map

| Route | Purpose |
|---|---|
| `/` | Landing |
| `/signup` `/login` `/account` | Auth + passkeys |
| `/create` `/templates` | New escrow |
| `/jobs` `/jobs/[id]` | Workspace |
| `/receipt/[id]` | Receipt |
| `/admin` | Ops dashboard + CSV |
| `/notifications` | Activity alerts |
| `/settings` | Env + DB health |
| `/docs/*` | In-app documentation |
| `/api/health` | Health JSON |

## Architecture (short)

```
Client creates job
  → PayPal AUTHORIZE (held)
Worker uploads proof
  → Muse compares to brief
  → CAPTURE (+ payout) or VOID / dispute / refund
```

Details: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Devpost submission checklist

| Item | Status |
|---|---|
| Meaningfully uses **PayPal** + **AI** | Done |
| Hosted demo URL | https://pay-when-done.vercel.app |
| Run instructions in README | This file |
| Public GitHub + MIT `LICENSE` | See repo + `LICENSE` |
| YouTube demo ≤ 3 minutes | **Record & link on Devpost** |
| Sponsor tools selected (if applicable) | On Devpost form |
| Deadline | **Thu Nov 12, 2026 · 12:00 pm PST** |
| Keep demo / sandbox / credits live until | **Dec 21, 2026** (winner announcement) |

After the deadline, do **not** edit the repo, video, or linked materials until winners are announced.

## License

MIT — see [`LICENSE`](LICENSE).
