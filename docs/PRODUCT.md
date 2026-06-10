# Hub Platform — Product

## Vision & Positioning

**One-liner**: The app store for serious athletes — purpose-built tools for
performance tracking, bundled into one account.

**Elevator pitch**: Most athletes juggle three different apps, three logins, and
three subscription emails to track HRV, training load, and power zones. Hub
puts every tool under one roof with one subscription model, one account, and
shared identity so coaches can see the same data their athletes see.

**Target market**:
- Competitive amateur athletes (CrossFit, BJJ/MMA, endurance) who care about
  objective performance data
- Individual sports coaches (strength & conditioning, fight coaches, cycling
  coaches) managing 5–30 athletes

**Differentiation**: Hub is not a generic fitness tracker — it does not compete
with Garmin Connect or Strava. It is a precision instrument marketplace for
athletes who already know they need HRV tracking or ACWR management. The tools
are opinionated and science-backed, not lowest-common-denominator.

---

## User Personas

### The Athlete — "Jordan"

**Profile**: 28-year-old amateur MMA fighter, trains 6x/week, works full-time.
Takes performance seriously but is not a full-time athlete.

**Goals**:
- Know whether today is a hard training day or a recovery day
- Avoid overtraining injuries before a competition
- See long-term fitness trends without manual spreadsheets

**Pain points**:
- Uses three apps with three logins. None talk to each other.
- Spends 20 minutes/week manually correlating HRV data with training load
- Coaches ask for data — there's no easy way to share a clean view

**How Hub solves it**: One account, one subscription, all tools in one UI.
Jordan buys Combat Tracker + HRV Monitor for $21/mo instead of managing
separate tools. When the coach asks for data, Jordan just adds them on Hub.

---

### The Coach — "Alex"

**Profile**: 35-year-old S&C coach, works with 12 athletes across combat sports
and CrossFit. Mixes remote and in-person clients.

**Goals**:
- Program training loads based on objective readiness data, not guesses
- Identify which athletes are overreaching before an injury happens
- Reduce the admin overhead of chasing athletes for data

**Pain points**:
- Athletes use different apps; Alex gets screenshots in WhatsApp
- No unified view to compare athletes side by side
- Paying for 4 different coaching tools that overlap

**How Hub solves it**: Alex purchases the Bundle, invites all athletes. Every
athlete's readiness and load data is in one dashboard. Alex programs with
confidence and athletes stop getting injured from overtraining.

---

## Feature List

### Core Platform — P0 (launch blockers)

| Feature | Priority | Notes |
|---|---|---|
| Sign up / log in (email + Google) | P0 | Clerk |
| Role selection at onboarding | P0 | athlete or coach |
| App catalog with prices | P0 | |
| Purchase individual app | P0 | Stripe Checkout |
| Entitlement guard on sub-apps | P0 | DB-verified, never client-trusted |
| Subscription management (cancel, view) | P0 | Stripe Customer Portal |
| Dashboard with owned apps | P0 | |
| Dark mode | P0 | Already scaffolded |

### Core Platform — P1 (launch quality)

| Feature | Priority | Notes |
|---|---|---|
| Bundle purchase (all apps) | P1 | One Stripe sub, three entitlements |
| Payment failure handling | P1 | past_due state, banner in dashboard |
| Coach invite flow | P1 | Email via Resend, signed JWT |
| Coach athlete roster view | P1 | |
| Admin panel (real data) | P1 | MRR, users, subscription counts |
| Onboarding checklist | P1 | First-run UX after sign-up |

### Core Platform — P2 (post-launch)

| Feature | Priority | Notes |
|---|---|---|
| Annual pricing (2 months free) | P2 | |
| Referral / affiliate links | P2 | |
| Team billing (coach pays for athletes) | P2 | Complex Stripe model |
| In-app notifications | P2 | |
| Mobile app (React Native) | P2 | Shared API layer |

---

### HRV Monitor — $9/mo

| Feature | Priority |
|---|---|
| Log daily HRV reading (manual entry) | P0 |
| Readiness score (0–100, algorithm-derived) | P0 |
| 7-day rolling trend chart | P0 |
| Baseline calculation (28-day rolling avg) | P0 |
| Color-coded daily recommendation (train/easy/rest) | P1 |
| Wearable import (Garmin, Polar, Whoop CSV) | P2 |

### Combat Tracker — $12/mo

| Feature | Priority |
|---|---|
| Log training session (type, duration, RPE) | P0 |
| Acute:Chronic Workload Ratio (ACWR) calculation | P0 |
| Weekly/monthly load chart | P0 |
| Overtraining risk indicator | P1 |
| Competition countdown integration | P1 |
| Sparring vs drilling split | P2 |

### Endurance Calculator — $7/mo

| Feature | Priority |
|---|---|
| FTP entry + training zones (7-zone) | P0 |
| Critical power calculator (3/12/20 min) | P0 |
| Zone distribution chart (recent rides) | P1 |
| W' (W-prime) balance estimator | P2 |
| Workout zone target export (Garmin/Zwift) | P2 |

---

## User Flows

### 1. Athlete Onboarding

```
Land on hub.com
  → Click "Get started"
  → Sign up (email or Google)
  → "What best describes you?" [Athlete / Coach]
  → Select "Athlete"
  → Redirected to /dashboard (empty state)
  → "Explore apps" CTA → /apps
  → Browse catalog, see pricing
  → Click "Unlock" on HRV Monitor
  → Stripe Checkout (card details)
  → Payment succeeds → /checkout/success
  → Redirect to /dashboard → HRV Monitor now appears as "Active"
  → Click "Open" → /app/hrv-monitor → onboarding tooltip
  → Log first HRV reading
```

### 2. Coach Onboarding

```
Sign up → select "Coach"
  → Redirected to /dashboard
  → Purchase Bundle ($29/mo) → Stripe Checkout
  → Return to /dashboard → all 3 apps active
  → Navigate to /dashboard → "Athletes" section → "Invite athlete"
  → Enter athlete's email → send invite
  → Athlete receives email, clicks "Accept invite"
  → Coach's /dashboard → athlete appears in roster
  → Click athlete name → see their HRV/load data (apps coach owns)
```

### 3. Unlock Flow (locked app → access)

```
/apps → click "Unlock" on locked app
  → POST /api/checkout { slug }
  → Redirect to Stripe Checkout
  → User completes payment
  → Stripe fires checkout.session.completed webhook
  → /api/webhooks/stripe → INSERT entitlements row
  → User lands on /checkout/success?session_id=...
  → Page polls /api/entitlements/[slug] until status = 'active' (max 10s)
  → CTA "Open [App Name]" appears
  → /app/[slug] → EntitlementGuard passes → app renders
```

### 4. Subscription Management

```
/profile → Subscriptions section
  → See all active subs with status, price, next billing date
  → Click "Manage billing" → POST /api/portal → Stripe Customer Portal
  → In portal: cancel, update card, download invoices
  → Cancel → "cancels at period end" → UI shows "Cancels Jan 15"
  → After period end: webhook fires → entitlements.status = 'canceled'
  → Next visit to /app/[slug] → EntitlementGuard → <Paywall /> shown
  → "Reactivate" CTA in Paywall → Stripe Checkout again
```

---

## Pricing Strategy

### Model: Per-app + bundle

| Product | Price | Justification |
|---|---|---|
| HRV Monitor | $9/mo | Comparable to Morpheus, Elite HRV premium |
| Combat Tracker | $12/mo | No direct competitor; extra value from ACWR |
| Endurance Calculator | $7/mo | Simple tool, entry-level price point |
| Bundle (all 3) | $29/mo | ~$7 savings vs buying all three; strong upsell |

**Bundle math**: Full price = $28/mo. Bundle = $29/mo.

Wait — that's actually more expensive. The bundle should be priced at $24–25/mo
to make it a genuine "save $4/mo" pitch. Recommended: **$24/mo for bundle**,
which saves $4 vs buying all three and creates clear pull-through.

**Why per-app pricing**: Athletes have different needs. A cyclist does not need
Combat Tracker. Per-app pricing reduces the barrier to the first purchase and
lets the customer self-select. The bundle converts users who have already
purchased two apps and can see the savings.

**Expansion revenue path**: Coach lands on bundle → invites athletes → athletes
see the tools → athletes convert to their own subscriptions. Coach is the
acquisition channel for athlete MRR.

**Future**: Annual pricing ($9/mo billed annually = $108/yr vs $108/yr at
$9/mo — offer 2 months free, so $90/yr) reduces churn and improves cash flow.
Not a launch feature; validate monthly retention first.

---

## Success Metrics

### North Star
**Monthly Recurring Revenue (MRR)** — the single number that reflects both
acquisition and retention.

### Acquisition
| Metric | Target (Month 3) | Target (Month 6) |
|---|---|---|
| Signups | 200 | 600 |
| Trial → Paid conversion | 40% | 50% |
| Paid users | 80 | 300 |

### Retention & Revenue
| Metric | Target | Notes |
|---|---|---|
| MRR | $2,000 (M3), $7,500 (M6) | |
| Monthly churn | < 5% | Sub-5% is sustainable for a niche product |
| ARPU | ~$13/mo | Between single-app and bundle average |

### Activation
| Metric | Target | Notes |
|---|---|---|
| Activation rate | > 60% | User logs at least one data point within 7 days of purchase |
| Most used app | HRV Monitor | Expected to be highest due to daily use pattern |
| Coach invite rate | > 30% of coaches send ≥1 invite | Validates coach→athlete flywheel |

### Health Indicators
| Metric | Notes |
|---|---|
| Payment failure rate | < 3% of attempted charges |
| Support ticket rate | < 2% of MAU per month |
| Webhook delivery lag | < 30 seconds p95 (Stripe → entitlement active) |
