# PayWhenDone — Demo Video Script (PayPal AI Hackathon)

**Target length:** 2.5–4 minutes  
**Live app:** https://pay-when-done.vercel.app  
**Tone:** Confident, product-led, judge-friendly. Speak naturally; click slowly enough that UI state is readable.

**Demo login:** On `/login`, enter `umer@umer.com`, then **sign in as demo admin** (do not show or say the password on camera).

---

## How to make the video

### Tools (Mac)

| Tool | Best for |
|---|---|
| **QuickTime Player** → File → New Screen Recording | Fastest; no install |
| **OBS Studio** | Cleaner framing, mic levels, scene switch |
| **Loom** | Quick share link; crop browser only |

### Setup checklist

1. **Resolution:** Record at **1920×1080** (or retina 2× and export 1080p).
2. **Browser:** Chrome or Safari — **hide bookmarks bar**, hide extensions, full window or clean profile.
3. **Zoom:** Browser zoom **110%** so titles and buttons read on a phone screen.
4. **URL bar:** Prefer a short window so `pay-when-done.vercel.app` stays visible.
5. **Audio:** External mic or AirPods; room quiet; say a test line and check levels.
6. **Pre-warm the app:** Open https://pay-when-done.vercel.app once so cold start isn’t on camera. Optionally seed admin data from `/admin` if the board looks empty.
7. **Proof image:** Have one clear photo ready (e.g. a cleaned kitchen / finished handyman area) in Downloads.

### Two recording strategies

**A — Pitch deck first (recommended for clarity)**  
1. Start at `/pitch` and walk slides 0–11 with narration.  
2. On key CTAs (“New job”, “Open Admin”), click through to the live product, demo the action, then return or jump ahead.  
3. End on `/about` for the founder close.

**B — Full click-through**  
Skip the deck as the spine; open the live app and follow the beat order below. Optionally flash `/pitch` for 5–8 seconds at the open and close.

### Export for Devpost / YouTube

- Export **H.264 / MP4**, **1080p**, **30 fps**, stereo AAC.
- Trim dead air; keep cuts under ~0.3s so the flow still feels live.
- Target file size under ~100–200 MB for Devpost; YouTube accepts larger.
- Title suggestion: `PayWhenDone — PayPal AUTHORIZE → Muse verify → capture`
- Description: include live URL, GitHub, and one-line value prop.
- Soft captions optional but helpful for judges watching muted.

---

## Shot list (beat → URL)

| Beat | Time | URL / path |
|---|---|---|
| Open + problem | 0:00–0:35 | `/pitch` |
| Signup / email-first login | 0:35–0:55 | `/login` (or `/signup`) |
| Create job wizard | 0:55–1:35 | `/create` |
| PayPal hold | 1:35–1:55 | `/jobs/[id]` |
| Proof upload | 1:55–2:15 | same job → Flow tab |
| Muse verify | 2:15–2:40 | same job |
| Capture / void | 2:40–3:00 | same job |
| Payout / settlement | 3:00–3:20 | `/admin/payouts` or job receipt |
| Admin console | 3:20–3:40 | `/admin` |
| Close / founder | 3:40–4:00 | `/about` (+ optional `/pitch` last slide) |

*Times are cues, not hard cuts. Aim for ~3:15 total.*

---

## Ready-to-record script

Format: **[time]** → **ON SCREEN** (clicks) → **SAY** (spoken lines)

---

### [0:00–0:20] Open — brand + hook

**ON SCREEN**  
- Open https://pay-when-done.vercel.app/pitch  
- Stay on the dark opening slide: **PayWhenDone**

**SAY**  
> Hi — I’m demoing **PayWhenDone**, built for the PayPal AI Hackathon.  
> It’s AI-verified PayPal escrow for local gigs hired off-platform — Facebook, Nextdoor, WhatsApp, word of mouth. Not a marketplace. Hold the money, prove the work, let Muse decide, then pay.

---

### [0:20–0:35] Problem

**ON SCREEN**  
- Advance `/pitch` to slide **1 · Problem** (“Off-platform gigs have no protection”)  
- Hover the three bullets briefly; do not click away yet

**SAY**  
> Off-platform gigs have zero protection. Clients pay upfront and risk a ghost. Workers finish and wait for a Venmo that never lands. Photos in a chat are not a contract. PayWhenDone puts a PayPal hold and an AI verifier between them.

---

### [0:35–0:55] Signup / email-first auth

**ON SCREEN**  
- From the pitch slide, click **Log in** → `/login`  
  *(or navigate directly to https://pay-when-done.vercel.app/login)*  
- Type email: `umer@umer.com`  
- Continue, then **sign in as demo admin** (password off-camera / already filled)  
- Brief glance at header showing signed-in session (optional: `/account` for 2 seconds to show passkeys exist — don’t register a new one)

**SAY**  
> Auth is email-first. Login asks for email, checks for a passkey, then offers password or WebAuthn — no clutter. I’m signing in as the demo admin with umer@umer.com. Protected routes — jobs, create, admin — sit behind this session.

---

### [0:55–1:35] Create job wizard

**ON SCREEN**  
- Go to https://pay-when-done.vercel.app/create  
- **Step Template:** click a template (e.g. Cleaning or Handyman) → **Continue**  
- **Step Details:** point at title, brief/acceptance criteria, amount → **Continue**  
- **Step People:** show client + worker name/email (defaults are fine) → **Continue**  
- **Step Payment:** leave **Auto PayPal payout to worker on release** on → **Continue**  
- **Step Review:** scan summary → click **Create escrow job** (or equivalent primary CTA)  
- Land on `/jobs/[id]`

**SAY**  
> Creating an escrow is a five-step wizard: template, details, people, PayPal options, review. The brief here is what Muse will judge later — clear acceptance criteria, not vibes. Auto-payout on release means once we capture, the worker can get settled through PayPal. Confirm… and we’re in the job workspace.

---

### [1:35–1:55] PayPal hold (AUTHORIZE)

**ON SCREEN**  
- On the job Flow tab: section **1. Client holds funds**  
- Click the fund / PayPal authorize button (`PayPalFundButton`)  
- Complete sandbox/mock authorize if prompted  
- Wait until status shows **funded** (hold active)

**SAY**  
> Client funds with PayPal intent **AUTHORIZE** — reserve, don’t capture. Money sits on hold until Muse approves or we void. Sandbox when keys are set; mock authorize when they’re not. Either way, the escrow state machine is live.

---

### [1:55–2:15] Worker proof

**ON SCREEN**  
- Section **2. Worker submits proof**  
- Choose a proof photo from disk  
- Type short notes that map to the brief (e.g. “Kitchen counters wiped, floor mopped, before/after in frame”)  
- Click **Submit proof**  
- Status → **proof_submitted**

**SAY**  
> Worker uploads a photo and notes that map back to the brief. This is the evidence — not a promise in a group chat. Submit proof.

---

### [2:15–2:40] Muse AI verify

**ON SCREEN**  
- Section **3. Run Muse verification**  
- Click **Verify with Muse AI**  
- Wait for verdict panel: Approved/Rejected · confidence · matched / missing  
- Pause on the verdict long enough to read confidence %

**SAY**  
> Muse Spark compares the image and notes to the acceptance criteria. We get approved or rejected, a confidence score, what matched, and what’s still missing. That verdict gates the money — capture only when the work checks out.

---

### [2:40–3:00] Capture or void

**ON SCREEN**  
- If **Approved:** click **Release PayPal payment** → show **Payment released** + capture id  
- *Optional 5-second aside (only if you have a second funded job):* open it and point at **Void hold** without confirming, or void a disposable job to show the cancel path  
- Do **not** dwell on both paths; prioritize capture for the happy path

**SAY**  
> On approval, we capture the authorization — PayPal takes the funds and the job moves to released. If Muse rejects or the gig dies, we void the hold so the client is never charged. Capture and void are first-class PayPal payment actions, not a fake toggle.

---

### [3:00–3:20] Invoice & payout

**ON SCREEN**  
- From the released job, briefly show success panel / receipt link if visible  
- Navigate to https://pay-when-done.vercel.app/admin/payouts  
- Optional: `/admin/invoices` or `/admin/ledger` for one beat each  
- Optional: open `/receipt/[id]` if you copied the job id

**SAY**  
> Settlement sits on top of capture: PayPal invoice for the record, payout to the worker email, and ledger rows for every money event. Auto-payout was on when we created the job, so release can push settlement without a second marketplace hop.

---

### [3:20–3:40] Admin console

**ON SCREEN**  
- Go to https://pay-when-done.vercel.app/admin  
- Pan KPIs: jobs, active holds, funds held, released  
- Click sidebar once: **Ledger** or **Webhooks** → back to overview  
- Optional: mention CSV export exists at `/api/jobs/export` without downloading

**SAY**  
> Admin is the ops view judges expect after the happy path — escrows, ledger, invoices, payouts, webhooks. Live counts for holds and released funds. Pitch mode lives here too for stage demos.

---

### [3:40–4:00] Close / founder + ask

**ON SCREEN**  
- Go to https://pay-when-done.vercel.app/about  
- Hold on founder photo + bio (Muhammad Umer Aamir)  
- Optional: jump back to `/pitch` last slide (**11 · Close**) and leave CTAs visible: About · Live Jobs · GitHub  
- End frame: live URL in the address bar

**SAY**  
> I’m Muhammad Umer Aamir — MAC student at Wilfrid Laurier. PayWhenDone is the full loop: PayPal AUTHORIZE, Muse verify, capture or void, payout, and admin — shipping as a working demo at pay-when-done.vercel.app.  
>  
> **Judges: if you hire off-platform, you deserve escrow that only pays when the work is done. Try the live app, create a job, and release a hold — thank you.**

---

## One-page cheat card (print / second monitor)

```
/pitch → problem
/login  umer@umer.com  (demo admin, password off-cam)
/create template → details → people → payment → review
/jobs/:id  Fund (AUTHORIZE) → Proof → Muse → Release
/admin/payouts  →  /admin  →  /about
Close: “Try the live app… thank you.”
```

## Backup lines (if something stalls)

- **Slow Muse / mock:** “When Muse is offline we fall back to a deterministic verifier so the demo never dies.”  
- **PayPal sandbox delay:** “Authorize is a real Orders v2 hold when sandbox keys are present.”  
- **Empty admin:** “I’ll seed from Admin so you can see ledger and webhook activity.”  
- **Skip void:** “Void is one click on any funded job — same workspace as capture.”

## Do / don’t

**Do**  
- Keep the cursor near the button you’re about to click  
- Pause ~1s after each status change  
- Say API names once (AUTHORIZE, capture, void, payout) — judges listen for PayPal surface area  

**Don’t**  
- Show passwords, `.env`, or API keys  
- Open DevTools or random tabs mid-take  
- Race through Muse verdict text  
- Promise marketplace features you don’t have — stay on escrow + AI verify  

---

## Suggested YouTube / Devpost blurb

> PayWhenDone — AI-verified PayPal escrow for off-platform gigs. Client AUTHORIZE hold → worker proof → Muse Spark verify → capture or void → optional payout. Live: https://pay-when-done.vercel.app · Pitch: /pitch · GitHub: umeraamir69/pay-when-done
