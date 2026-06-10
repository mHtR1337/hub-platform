# Hub — Product

> **Built for Mladen's world.** One platform where evidence-based training tools live under a single roof — readiness, load, and performance zones that coaches and athletes actually use to make decisions, not decorate dashboards.

---

## Vision

Hub is the **operating system for performance coaching** — a platform shell that hosts precision instruments for load management, recovery monitoring, and training prescription. It is not another fitness app. It is infrastructure for the methodology: the same tools Mladen teaches, packaged so an athlete can log a morning HRV reading and a coach can see it alongside weekly ACWR before writing today's session.

**The bet**: Elite sport doesn't need more data. It needs fewer logins, one source of truth, and tools that speak the language coaches already use — readiness scores, acute:chronic workload ratios, training zones, periodisation blocks — not steps counted and calories burned.

**For Mladen specifically**: Hub is a white-label-ready platform that can carry his brand, his frameworks, and his athlete roster. He is the ideal design partner — the person who knows which metrics matter, which ratios trigger intervention, and what a coach managing twelve fighters actually needs at 6 AM before the morning session.

---

## Why Now / Why Hub

### What's broken today

```
Athlete's morning                         Coach's morning
─────────────────                         ─────────────────
Open HRV app (login 1)                    Check WhatsApp for screenshots
Open Google Sheet for load log (login 0)  Open TrainingPeaks (login 2)
Open Strava for zones (login 3)           Open separate HRV export (login 4)
Screenshot ACWR to coach                  Manually reconcile three data sources
Guess if today is hard or easy            Program blind, hope nobody breaks
```

The performance ecosystem is fragmented by design. Every tool optimises for its own subscription, its own data model, its own export format. Coaches become data janitors. Athletes become screenshot couriers. The methodology — the actual science of load, recovery, and adaptation — gets lost in the friction between apps.

### Why Hub wins

| Problem | Current state | Hub |
|---|---|---|
| Identity | 3–5 accounts per athlete | One Clerk session, one profile |
| Billing | Separate Stripe charges, separate cancels | Per-app or bundle; Stripe Customer Portal |
| Access control | Honour system, shared passwords | Server-verified entitlements — DB is law |
| Coach visibility | WhatsApp screenshots, CSV exports | Invite-based roster; coach sees what athlete logs |
| Methodology | Scattered across tools with different models | Sub-apps built around load, readiness, zones |
| Brand | Generic SaaS UI | Platform shell Mladen can own and extend |

Hub does not replace Mladen's expertise. It **removes the admin tax** so his expertise scales to every athlete on the roster without him chasing data.

---

## Personas

### Stefan — Professional MMA Fighter, 27

**Context**: Undefeated regional prospect. Trains twice daily — S&C in the morning, MMA in the evening. Eight weeks out from a title fight. Works with Mladen's remote programming.

**What he needs**:
- Wake up, measure HRV, know within 60 seconds: *train hard, moderate, or pull back*
- Log every S&C and sparring session so ACWR stays in the sweet spot — not the injury zone
- Stop sending his coach screenshots; just train

**What breaks today**:
- HRV lives in one app. Load log is a shared Google Sheet he forgets to update. His coach asks "what was your ACWR last week?" and he has to calculate it manually.
- After a hard sparring week he pushed through a red readiness day because nothing connected HRV to the load plan.

**Hub for Stefan**:
- Buys **HRV Monitor** ($9/mo) and **Combat Tracker** ($12/mo) — $21/mo total, less than one physiotherapy session
- Morning: log HRV → readiness score → colour-coded recommendation
- Post-session: log duration, RPE, session type → ACWR updates automatically
- Mladen sees both on the roster dashboard before writing today's programme

---

### Mladen — S&C Coach & Sports Scientist, 14 Athletes

**Context**: Runs remote and in-person programmes across MMA, combat sports, and field athletes. Known for evidence-based load management. Needs a platform that reflects how he actually coaches — not how a generic fitness app thinks coaching works.

**What he needs**:
- One dashboard for twelve athletes' readiness and load — not twelve WhatsApp threads
- Confidence that when he prescribes a deload, the data supports it
- A platform he can put his name on as his athletes scale

**What breaks today**:
- Athletes use different tools. Data arrives as screenshots, PDF exports, and "I think my HRV was low?"
- He pays for TrainingPeaks, a separate HRV tool, and a spreadsheet system that only he understands
- Onboarding a new athlete means teaching them three apps instead of one methodology

**Hub for Mladen**:
- **Bundle** ($24/mo) unlocks every tool — his reference stack, always current
- Invites athletes by email; roster populates as they accept
- Opens Stefan's profile: HRV trend (7-day), ACWR (28-day chronic), last session RPE — programmes in minutes, not hours
- As a partner: new sub-apps slot into the catalog under his brand without rebuilding auth, billing, or access control

---

## The App Catalog

Three instruments at launch. Each is a standalone subscription. Each implements a piece of the performance puzzle Mladen already teaches.

### HRV Monitor — Readiness & Recovery · $9/mo

| Capability | What it means in practice |
|---|---|
| Daily HRV logging | RMSSD entry or wearable import — one number, every morning |
| Readiness score (0–100) | Algorithm-derived score from baseline deviation — not a gut feeling |
| 28-day rolling baseline | Context for today's reading; flags meaningful change, not noise |
| 7-day trend chart | See the recovery arc across a fight camp or deload block |
| Train / moderate / rest signal | Colour-coded daily recommendation tied to the score |

*The question it answers*: **"Should I train hard today?"**

---

### Combat Tracker — Load Management · $12/mo

| Capability | What it means in practice |
|---|---|
| Session logging (type, duration, RPE) | Every S&C session, sparring block, and drill round captured |
| Acute:Chronic Workload Ratio (ACWR) | The ratio Mladen uses to flag overreach before injury |
| Weekly / monthly load charts | Visualise accumulation across mesocycles |
| Overtraining risk indicator | Traffic-light when ACWR exits the target band |
| Sparring vs drilling split | Combat-specific load categorisation |

*The question it answers*: **"Am I accumulating too much, too fast?"**

---

### Endurance Calculator — Training Zones · $7/mo

| Capability | What it means in practice |
|---|---|
| FTP entry + 7-zone model | Power-based zones from a field test or lab result |
| Critical power calculator | 3 / 12 / 20-minute test inputs → CP and W′ |
| Zone distribution chart | Where recent work actually landed vs where it should |
| Workout export (planned) | Push targets to Garmin / Zwift |

*The question it answers*: **"Am I training in the right intensity bands?"*

---

## Platform Capabilities

Everything below is **platform infrastructure** — shared across all sub-apps. Sub-apps never reimplement auth, billing, or access control.

| Capability | Status | Why it matters |
|---|---|---|
| Sign up / sign in (email, Google) | Live | Clerk — production auth in hours, not weeks |
| App catalog with live entitlements | Live | Athletes see exactly what they own vs what they need |
| Per-app Stripe Checkout | Live | Unlock in two clicks; no sales call required |
| Server-side entitlement guard | Live | Access verified in Postgres on every `/app/*` request |
| Stripe webhook → entitlements sync | Live | Stripe is source of truth; client never grants access |
| Subscription management (Customer Portal) | Planned | Athletes cancel, update card, download invoices |
| Coach invite + athlete roster | Planned | Mladen adds Stefan; Stefan accepts; data flows |
| Bundle purchase | Planned | One subscription, all tools unlocked |
| Admin panel (MRR, users, subs by app) | Planned | Platform operator visibility |

---

## User Flows

### Flow 1 — Stefan unlocks Combat Tracker, fight camp week 3

```
Monday 06:45 — Stefan opens Hub on his phone
  → /apps catalog: HRV Monitor ✓ Active, Combat Tracker 🔒 Locked
  → Taps "Unlock" on Combat Tracker
  → POST /api/stripe/checkout { appSlug: "combat-tracker" }
  → Redirected to Stripe Checkout — enters card once
  → Payment succeeds → returns to /apps?checkout=success
  → Stripe webhook fires → entitlements row: status=active
  → Catalog refreshes: Combat Tracker ✓ Active

Monday 07:30 — First session logged
  → Opens /app/combat-tracker
  → Server checks hasEntitlement(userId, "combat-tracker") → pass
  → Logs: S&C, 75 min, RPE 7
  → ACWR calculates: 1.12 — green, within target band

Monday 08:00 — Mladen's view (when coach features ship)
  → Opens roster → Stefan → sees HRV from this morning + ACWR update
  → Adjusts today's evening session: reduce sparring volume, keep S&C
```

### Flow 2 — Mladen onboards a new athlete mid-camp

```
Mladen signs up → selects Coach role → purchases Bundle ($24/mo)
  → All three apps active on his account
  → Dashboard → Athletes → "Invite athlete"
  → Enters Stefan's email → Resend sends signed invite (48h TTL)

Stefan receives email → clicks Accept → coach_athletes status: active
  → Stefan already owns HRV Monitor; Mladen sees his readiness data
  → Stefan unlocks Combat Tracker himself (his subscription, his cost)
  → Mladen sees load data for any app he holds — no data hostage situation

Camp week 6 — Stefan's ACWR hits 1.45
  → Mladen's roster flags overreach
  → Deload prescribed before the injury, not after
```

### Flow 3 — Blocked access (entitlement guard)

```
Stefan bookmarks /app/combat-tracker but cancels subscription
  → Stripe webhook: customer.subscription.deleted → status=canceled
  → Stefan visits /app/combat-tracker
  → Server-side hasEntitlement() → false
  → Redirect to /apps?locked=true
  → No client-side bypass. No stale cookie. DB said no.
```

### Flow 4 — Subscription management

```
Stefan → /profile → Subscriptions
  → Combat Tracker: Active, $12/mo, renews Feb 15
  → "Manage billing" → Stripe Customer Portal
  → Cancels at period end
  → UI shows "Cancels Feb 15" — access continues until period end
  → Feb 16: entitlement.status = canceled → /app/combat-tracker locked
  → Paywall with "Reactivate" → Stripe Checkout again
```

---

## Pricing

### Philosophy

Mladen's athletes are not price-sensitive on a $9 tool that prevents a $2,000 injury. They **are** sensitive to paying for tools they don't use. Hub pricing follows three rules:

1. **Low entry point** — $7–$12 per app removes the "let me think about it" friction
2. **Pay for what you use** — A pure striker doesn't need Endurance Calculator; don't charge them for it
3. **Bundle pulls serious users** — Coaches and multi-sport athletes get the full stack at a discount; Mladen's roster is the natural bundle customer

### Price table

| Product | Price | Comparable | Value anchor |
|---|---|---|---|
| HRV Monitor | **$9/mo** | Morpheus, Elite HRV Premium | Daily readiness — the first decision of every training day |
| Combat Tracker | **$12/mo** | No direct ACWR-native competitor | Load management for fight camps — injury prevention, not logging |
| Endurance Calculator | **$7/mo** | TrainingPeaks zone tools (bundled in $20+ plans) | Zone prescription without a full TP subscription |
| **Bundle (all 3)** | **$24/mo** | — | Saves $4/mo vs à la carte; Mladen's recommended stack |

### Why this works for Mladen's brand

- **Athletes self-select**: Stefan buys HRV + Combat ($21). A cyclist buys Endurance only ($7). No forced bundle.
- **Coach as channel**: Mladen on Bundle sees every tool. Athletes he invites discover tools through his programming — organic upsell.
- **Scalable revenue**: 14 athletes × average $15/mo ARPU = $210/mo athlete MRR before a single coach subscription. Platform scales with roster size.
- **Partner path**: Custom sub-apps (e.g. "Mladen's Load Calculator") slot into the same catalog, same billing rails, same entitlement system — new SKUs without new infrastructure.

### Future pricing (post-validation)

| Option | Timing | Rationale |
|---|---|---|
| Annual billing (2 months free) | After 90-day retention data | Reduces churn; improves cash flow for platform ops |
| Coach-pays-for-athletes (team billing) | Phase 2 | Mladen buys 10 seats; athletes get access — higher ACV |
| White-label tier | Partner conversation | Mladen's domain, his branding, revenue share |

---

## Success Metrics

### North star

**Monthly Recurring Revenue (MRR)** — reflects acquisition, retention, and expansion in one number.

### What "working" looks like for Mladen as design partner

| Signal | Target | Why |
|---|---|---|
| Activation rate | > 60% log data within 7 days of purchase | Tool is used, not abandoned |
| Daily HRV log rate | > 4 days/week per active user | Readiness becomes habit |
| Coach invite rate | > 30% of coaches invite ≥ 1 athlete | Coach→athlete flywheel spinning |
| Webhook → entitlement lag | < 30s p95 | Unlock feels instant after payment |
| Monthly churn | < 5% | Niche product; high-intent users |
| Bundle attach rate | > 25% of paying users | Full-stack adoption |

---

## The Ask

Hub is infrastructure. The methodology is Mladen's. The platform handles identity, billing, entitlements, and coach–athlete relationships so every hour spent building goes into tools that reflect how elite performance coaching actually works — not into rebuilding login screens.

**What we're showing today**: A working platform shell with live billing, server-verified access control, and three sub-app slots ready for production-grade instruments.

**What we want from this conversation**: Validation of the app catalog, pricing, and coach workflow — and a partnership to make Hub the platform his athletes and his brand deserve.
