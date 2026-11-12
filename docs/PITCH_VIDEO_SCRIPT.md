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
8. **Sign in before `/pitch`:** Live job counts and deep-links need the umer admin session.

### Two recording strategies

**A — Pitch walkthrough first (recommended)**  
1. Start at `/pitch` — **0 · About me** (founder photo + name).  
2. Advance through each screen step; on primary CTAs (“Open About”, “Open Jobs”, “Open escrow job”), click into the live page, demo briefly, return with browser back or reopen `/pitch`.  
3. End on **10 · Close** / live Jobs CTA.

**B — Full click-through**  
Skip the deck as the spine; open the live app and follow the beat order below. Optionally flash `/pitch` for 5–8 seconds at the open (About me) and close.

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
| About me / founder | 0:00–0:25 | `/pitch` (slide 0) → optional `/about` |
| Landing / problem-solution | 0:25–0:45 | `/` or `/how-it-works` |
| Templates + Ask AI | 0:45–1:00 | `/templates` |
| Create job wizard | 1:00–1:35 | `/create` |
| Jobs list (seeded) | 1:35–1:50 | `/jobs` |
| Escrow flow (hold → proof → Muse → release) | 1:50–2:40 | `/jobs/[id]` (Studio move seed) |
| PayPal panel / ledger IDs | 2:40–3:00 | tutoring job or `/admin/ledger` |
| Disputes / milestones | 3:00–3:15 | Deck railing / bathroom seed |
| Admin console | 3:15–3:35 | `/admin` → ledger / jobs |
| Account / passkeys | 3:35–3:45 | `/account` (brief) |
| Close / CTA | 3:45–4:00 | `/pitch` last slide or `/jobs` |

*Times are cues, not hard cuts. Aim for ~3:15 total.*

---

## Ready-to-record script

Format: **[time]** → **ON SCREEN** (clicks) → **SAY** (spoken lines)

---

### [0:00–0:25] About me

**ON SCREEN**  
- Open https://pay-when-done.vercel.app/pitch  
- Hold on **0 · About me**: founder photo, **Muhammad Umer Aamir**, PayWhenDone builder  
- Optional: click **Open About** for 3 seconds, then back to `/pitch`

**SAY**  
> Hi — I’m Muhammad Umer Aamir, founder and builder of **PayWhenDone** for the PayPal AI Hackathon.  
> It’s AI-verified PayPal escrow for local gigs hired off-platform — Facebook, Nextdoor, WhatsApp, word of mouth. I’m going to walk each screen with the seeded demo data.

---

### [0:25–0:45] Landing / problem

**ON SCREEN**  
- Advance to **1 · Landing**  
- Click **Open landing** or **How it works** briefly

**SAY**  
> Off-platform gigs have zero protection. Clients pay upfront and risk a ghost. Workers finish and wait for a Venmo that never lands. PayWhenDone puts a PayPal hold and an AI verifier between them.

---

### [0:45–1:00] Templates + Ask AI

**ON SCREEN**  
- Advance to **2 · Templates** → **Open Templates**  
- Show catalog filters; scroll to **Ask AI** once

**SAY**  
> Twenty-four ready briefs — or Ask AI drafts a custom template from a plain-language description, then prefills create.

---

### [1:00–1:35] Create job wizard

**ON SCREEN**  
- `/create` — template → details → people → PayPal options → review  
- Or stay on the pitch step and point at the CTA, then jump to a seeded job if short on time

**SAY**  
> Creating an escrow is a five-step wizard. The brief here is what Muse will judge later — clear acceptance criteria, not vibes.

---

### [1:35–1:50] Jobs list

**ON SCREEN**  
- `/jobs` with seeded board (signed in as umer@umer.com)  
- Point at funded / disputed / released rows

**SAY**  
> The pitch seed fills a full ops board — holds, Muse verdicts, disputes, releases — owned by the demo admin.

---

### [1:50–2:40] Escrow flow

**ON SCREEN**  
- From pitch **5 · Escrow flow**, click **Open escrow job** → Studio move seed  
- Flow tab: hold → proof → Muse → release (or narrate status if already `ai_approved`)

**SAY**  
> One job end-to-end: AUTHORIZE hold, worker proof, Muse Spark verdict, then capture or void. Verdict gates the money.

---

### [2:40–3:00] PayPal panel

**ON SCREEN**  
- Tutoring seed or Admin ledger — show order / auth / capture / payout IDs

**SAY**  
> Every money event leaves sandbox-shaped PayPal IDs on the job — the same shapes Admin ledger and webhooks show.

---

### [3:00–3:15] Disputes & milestones

**ON SCREEN**  
- Deck railing dispute thread; optional bathroom milestones

**SAY**  
> Real gigs go sideways — dispute notes stay on the job, and milestones split larger work without inventing a marketplace.

---

### [3:15–3:35] Admin

**ON SCREEN**  
- `/admin` KPIs → sidebar **Ledger** or **Jobs** once

**SAY**  
> Admin is the ops view — escrows, ledger, invoices, payouts, webhooks. Live counts for holds and released funds.

---

### [3:35–3:45] Account / passkeys

**ON SCREEN**  
- `/account` for ~5 seconds — mention optional passkey, don’t register on camera

**SAY**  
> Auth is email-first; passkeys are optional on Account after signup — no clutter on the login form.

---

### [3:45–4:00] Close

**ON SCREEN**  
- `/pitch` last slide or live `/jobs`  
- End frame: live URL in the address bar

**SAY**  
> PayWhenDone is the full loop: PayPal AUTHORIZE, Muse verify, capture or void, payout, and admin — live at pay-when-done.vercel.app.  
>  
> **Judges: if you hire off-platform, you deserve escrow that only pays when the work is done. Try the live app — thank you.**

---

## One-page cheat card (print / second monitor)

```
/pitch  → 0 About me → landing → templates → create → jobs
        → escrow (Studio move) → PayPal IDs → disputes → admin → account → close
/login  umer@umer.com  (demo admin, password off-cam)
/jobs/:id  Fund (AUTHORIZE) → Proof → Muse → Release
/admin  →  /about
Close: “Try the live app… thank you.”
```

## Backup lines (if something stalls)

- **Slow Muse / mock:** “When Muse is offline we fall back to a deterministic verifier so the demo never dies.”  
- **PayPal sandbox delay:** “Authorize is a real Orders v2 hold when sandbox keys are present.”  
- **Empty admin:** “I’ll seed from Admin so you can see ledger and webhook activity.”  
- **Skip void:** “Void is one click on any funded job — same workspace as capture.”  
- **Not signed in on pitch:** “Sign in as the demo admin to deep-link seeded jobs and load live KPIs.”

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

> PayWhenDone — AI-verified PayPal escrow for off-platform gigs. Client AUTHORIZE hold → worker proof → Muse Spark verify → capture or void → optional payout. Live: https://pay-when-done.vercel.app · Pitch: /pitch (starts with About me) · GitHub: umeraamir69/pay-when-done
