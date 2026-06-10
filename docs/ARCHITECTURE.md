# Hub — Architecture

> Technical architecture for a platform built to carry Mladen's methodology at scale — one auth layer, one billing layer, one entitlements truth, many precision instruments.

---

## What Hub Is

Hub is a **platform shell**, not an application. It answers exactly one question on every protected request:

> *Does this user hold an active entitlement for this app slug?*

If yes → the sub-app renders. If no → paywall or redirect. Sub-apps never implement auth, billing, or access control. They receive a verified `userId` and focus entirely on load management, readiness, zones, or whatever instrument they implement.

```
┌─────────────────────────────────────────────────────────────────┐
│  PLATFORM SHELL (Hub owns this)                                 │
│  Auth · Billing · Entitlements · Coach roster · Admin           │
├─────────────────────────────────────────────────────────────────┤
│  SUB-APPS (methodology instruments)                             │
│  HRV Monitor          /app/hrv-monitor                          │
│  Combat Tracker       /app/combat-tracker                       │
│  Endurance Calculator /app/endurance-calculator                   │
│  [Future: Mladen-branded tools]   /app/<slug>                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## System Architecture

```
                              ┌──────────────┐
                              │   Browser    │
                              └──────┬───────┘
                                     │ HTTPS
                                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                         Next.js 15 App Router                              │
│                                                                            │
│  ┌─────────────┐    ┌──────────────────┐    ┌─────────────────────────┐   │
│  │ middleware  │───▶│  Platform Shell  │    │  API Routes             │   │
│  │   (Clerk)   │    │  /dashboard      │    │  /api/stripe/checkout   │   │
│  │             │    │  /apps           │    │  /api/stripe/webhook    │   │
│  │ no session? │    │  /profile        │    │  /api/entitlements/*    │   │
│  │ → /login    │    │  /admin          │    │  /api/coach/*           │   │
│  └─────────────┘    └────────┬─────────┘    └────────────┬────────────┘   │
│                              │                             │               │
│                              ▼                             │               │
│                    ┌──────────────────┐                      │               │
│                    │ Entitlement Guard│◀─────────────────────┘               │
│                    │  /app/[slug]     │  (server-side DB check)             │
│                    │                  │                                      │
│                    │  entitled? ──yes─▶ Sub-app renders                      │
│                    │       │                                                │
│                    │      no ──▶ redirect /apps?locked=true                 │
│                    └────────┬─────────┘                                      │
│                             │                                                │
│                             ▼                                                │
│                    ┌──────────────────┐                                        │
│                    │   Sub-app Module │  sub-apps/<slug>/index.tsx           │
│                    │   (HRV, ACWR,    │  Own data model, own UI              │
│                    │    Zones, etc.)  │  Receives verified userId             │
│                    └────────┬─────────┘                                      │
└─────────────────────────────┼────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Prisma ORM     │  Type-safe queries, schema-as-code
                    │   lib/db.ts      │  @prisma/adapter-pg driver adapter
                    └────────┬─────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Supabase Postgres│  Relational constraints for
                    │  (PostgreSQL)    │  entitlements correctness
                    └──────────────────┘


        ┌──────────────┐                              ┌──────────────────┐
        │    Stripe    │                              │      Clerk       │
        │   Checkout   │                              │   Auth + JWT     │
        │   Webhooks   │                              │   User webhooks  │
        └──────┬───────┘                              └────────┬─────────┘
               │                                                 │
               │  checkout.session.completed                     │  user.created
               │  customer.subscription.updated                  │
               │  customer.subscription.deleted                  ▼
               │                                        ┌──────────────────┐
               └───────────────────────────────────────▶│  users table     │
                          POST /api/stripe/webhook      │  (clerk_id sync) │
                          verify signature              └──────────────────┘
                          upsert entitlements
                                 │
                                 ▼
                        ┌──────────────────┐
                        │  entitlements    │  ◀── SOURCE OF TRUTH for access
                        │  table           │
                        └──────────────────┘
```

---

## Unlock Flow — End to End

```
 Stefan taps "Unlock" on Combat Tracker
         │
         ▼
 ┌───────────────────────────────────────────────────────────┐
 │  AppCard (client)                                         │
 │  POST /api/stripe/checkout  { appSlug: "combat-tracker" } │
 └───────────────────────────┬───────────────────────────────┘
                             │
                             ▼
 ┌───────────────────────────────────────────────────────────┐
 │  Checkout Route (server)                                    │
 │  1. auth() → Clerk session required                       │
 │  2. db.user.findUnique({ clerkId })                        │
 │  3. db.app.findFirst({ slug, active }) → stripe_price_id  │
 │  4. stripe.checkout.sessions.create({                     │
 │       mode: "subscription",                               │
 │       metadata: { userId, appSlug, clerkUserId }          │
 │     })                                                    │
 │  5. return { url }                                        │
 └───────────────────────────┬───────────────────────────────┘
                             │
                             ▼
 ┌───────────────────────────────────────────────────────────┐
 │  Stripe Checkout (hosted)                                 │
 │  Stefan enters payment → subscription created             │
 └───────────────────────────┬───────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
   Redirect to /apps?checkout=success   Stripe fires webhook
   (immediate, client-side)            POST /api/stripe/webhook
                                              │
                                              ▼
                                    ┌─────────────────────┐
                                    │ 1. Verify signature │
                                    │    (STRIPE_WEBHOOK_ │
                                    │     SECRET)         │
                                    │ 2. Idempotency check│
                                    │    subscription_    │
                                    │    events table     │
                                    │ 3. Upsert           │
                                    │    entitlements:    │
                                    │    status=active    │
                                    │    stripe_sub_id    │
                                    │    period_end       │
                                    └─────────┬───────────┘
                                              │
                                              ▼
                                    ┌─────────────────────┐
                                    │  entitlements row   │
                                    │  user_id + app_slug │
                                    │  status: active     │
                                    └─────────┬───────────┘
                                              │
                                              ▼
 Stefan opens /app/combat-tracker
         │
         ▼
 ┌───────────────────────────────────────────────────────────┐
 │  app/app/[slug]/page.tsx (server)                         │
 │  hasEntitlement(clerkUserId, "combat-tracker")            │
 │    → db.entitlement.findFirst({                           │
 │         status IN (active, trialing),                     │
 │         currentPeriodEnd > now()                          │
 │       })                                                  │
 │  entitled? → render sub-app                               │
 │  denied?   → redirect /apps?locked=true                   │
 └───────────────────────────────────────────────────────────┘
```

**Critical invariant**: The client never writes entitlements. Stripe webhooks are the only writer. The browser never decides access — Postgres does.

---

## Database — Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ┌──────────────┐         ┌──────────────────┐         ┌──────────────┐   │
│   │    users     │         │   entitlements   │         │     apps     │   │
│   ├──────────────┤         ├──────────────────┤         ├──────────────┤   │
│   │ id (PK)      │──┐   ┌──│ id (PK)          │    ┌────│ id (PK)      │   │
│   │ clerk_id (UQ)│  │   │  │ user_id (FK)─────┼────┘    │ slug (UQ)    │◀─┐│
│   │ email (UQ)   │  │   │  │ app_slug (FK)────┼─────────│ name         │  ││
│   │ role         │  └───│──│ status           │         │ description  │  ││
│   │ created_at   │      │  │ stripe_sub_id(UQ)│         │ price_cents  │  ││
│   └──────┬───────┘      │  │ stripe_cust_id   │         │ stripe_price │  ││
│          │              │  │ current_period_  │         │ active       │  ││
│          │              │  │   end            │         │ sort_order   │  ││
│          │              │  │ cancel_at_end    │         └──────────────┘  ││
│          │              │  │ created/updated  │                           ││
│          │              │  └──────────────────┘                           ││
│          │              │         ▲                                       ││
│          │              │         │ FK: app_slug → apps.slug             ││
│          │              └─────────┘                                       ││
│          │                                                                ││
│          │         ┌──────────────────┐                                 ││
│          │         │  coach_athletes  │                                 ││
│          │         ├──────────────────┤                                 ││
│          ├────────▶│ coach_id (FK)    │                                 ││
│          │         │ athlete_id (FK)──┼──▶ users                        ││
│          └────────▶│ status           │   (pending/active/revoked)      ││
│                    │ invite_token (UQ)│                                 ││
│                    │ invited/accepted │                                 ││
│                    │ UNIQUE(coach,    │                                 ││
│                    │        athlete)  │                                 ││
│                    └──────────────────┘                                 ││
│          │                                                                ││
│          │         ┌──────────────────────┐                              ││
│          └────────▶│ subscription_events  │  (append-only audit)          ││
│                    ├──────────────────────┤                              ││
│                    │ user_id (FK)         │                              ││
│                    │ app_slug             │                              ││
│                    │ event_type           │                              ││
│                    │ stripe_event_id (UQ) │  ◀── idempotency key         ││
│                    │ payload (JSONB)      │                              ││
│                    └──────────────────────┘                              ││
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Indexes (performance-critical):
  users.clerk_id              → every auth'd request resolves user
  entitlements(user_id)       → catalog: "what does this user own?"
  entitlements(user_id, slug) → guard: "does this user own THIS app?"
  entitlements.stripe_sub_id  → webhook: upsert by subscription
```

---

## Sub-App Plug-In Pattern

Adding a new instrument (e.g. "Mladen Load Calculator") requires **zero changes** to auth, billing, or entitlements infrastructure.

```
  NEW SUB-APP ONBOARDING
  ══════════════════════

  Step 1 — Module                    Step 2 — Database
  ┌─────────────────────┐            ┌─────────────────────┐
  │ sub-apps/           │            │ INSERT INTO apps    │
  │   mladen-load-calc/ │            │   slug, name,       │
  │     config.ts       │            │   stripe_price_id,  │
  │     index.tsx       │            │   price_monthly_cents│
  └─────────┬───────────┘            └──────────┬──────────┘
            │                                   │
            └──────────────┬────────────────────┘
                           │
                           ▼
              Step 3 — Automatic (platform handles)
              ┌─────────────────────────────────────────┐
              │  /apps catalog     → app appears        │
              │  /app/[slug]       → route exists       │
              │  EntitlementGuard  → checks DB          │
              │  Stripe Checkout   → uses price_id      │
              │  Webhook           → creates entitlement│
              └─────────────────────────────────────────┘
                           │
                           ▼
              Step 4 — Sub-app only cares about data
              ┌─────────────────────────────────────────┐
              │  export default function MladenLoadCalc │
              │    ({ userId }: { userId: string })    │
              │    // fetch, compute, render            │
              │    // ACWR, readiness, zones — yours    │
              └─────────────────────────────────────────┘


  WHAT THE PLATFORM NEVER ASKS THE SUB-APP TO DO
  ──────────────────────────────────────────────
  ✗ Implement login
  ✗ Handle Stripe
  ✗ Check cookies or localStorage for access
  ✗ Manage coach–athlete relationships
  ✗ Build a paywall
```

---

## Stack — Every Decision Justified

| Layer | Choice | Why this, not that |
|---|---|---|
| Framework | **Next.js 15 App Router** | RSC runs entitlement checks on the server with zero client bundle; nested layouts give platform shell + sub-app shell for free — not Remix or Vite+Express where we'd rebuild this routing model |
| Language | **TypeScript (strict)** | Shared types from Prisma schema to API to UI — not plain JS where entitlement status strings drift from the DB |
| Styling | **Tailwind CSS v4 + shadcn/ui** | Utility-first with accessible primitives; dark mode is a class toggle — not a component library lock-in like MUI |
| Auth | **Clerk** | Sessions, JWTs, social login, webhooks in production in hours — not NextAuth where we'd own session storage, refresh logic, and MFA |
| Database | **Supabase Postgres** | Managed PostgreSQL with connection pooling; relational FK constraints prevent orphan entitlements — not MongoDB where subscription state has no schema enforcement |
| ORM | **Prisma 7** | Schema-as-code, typed client, migration history — not Drizzle where we'd lose Prisma Studio and the ecosystem for marginal raw-SQL gains |
| Payments | **Stripe Checkout + Webhooks** | Hosted PCI-compliant checkout; subscription lifecycle events are reliable and documented — not Paddle or LemonSqueezy with weaker subscription webhook models |
| Email | **Resend** | React Email templates, simple API, generous free tier — not SendGrid with template management overhead for invite-only volume |
| Hosting | **Vercel → Azure (Phase 5)** | Vercel for rapid iteration now; Azure Container Apps for Mladen's production requirement — not AWS from day one when speed matters more |
| Package manager | **pnpm** | Strict dependency hoisting prevents phantom deps in a monorepo-ready layout — not npm where duplicate packages inflate the bundle |

---

## Entitlements System

The security core. Five rules, no exceptions.

### Rule 1 — Never trust the client

No cookie, localStorage flag, or client-side state grants access. Every `/app/*` route calls `hasEntitlement()` on the server. Cost: ~1ms on a warm Prisma connection.

```typescript
// lib/entitlements.ts
export async function hasEntitlement(clerkUserId: string, appSlug: string) {
  const entitlement = await db.entitlement.findFirst({
    where: {
      user: { clerkId: clerkUserId },
      appSlug,
      status: { in: ["active", "trialing"] },
      currentPeriodEnd: { gt: new Date() },
    },
  })
  return entitlement !== null
}
```

### Rule 2 — Middleware handles auth; guard handles access

| Layer | Responsibility | Implementation |
|---|---|---|
| Edge middleware | Is there a valid Clerk session? | `middleware.ts` → redirect `/login` |
| Server component | Does this user own this app? | `hasEntitlement()` → redirect or render |

Auth without entitlements is useless. Entitlements without auth is impossible.

### Rule 3 — Stripe webhooks are the only writer

Nothing else inserts or updates `entitlements`. Not the checkout success page. Not a client callback. The webhook handler verifies the signature, checks idempotency, then upserts.

### Rule 4 — `current_period_end` is the expiry clock

Even if a webhook is delayed, the guard checks `currentPeriodEnd > now()`. A canceled subscription cannot appear active because the period hasn't ended yet — and cannot stay active after it has.

### Rule 5 — Coach access is additive

A coach reading athlete data requires **four** conditions:

```
session valid  AND  role = coach  AND  coach_athletes.status = active  AND  coach holds entitlement
```

The coach's entitlement gates access — not the athlete's. Mladen pays for his tools; he sees data for athletes who accepted his invite.

---

## API Routes

All routes under `app/api/`. Protected routes use `auth()` from `@clerk/nextjs/server`.

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/stripe/checkout` | POST | Clerk session | Create Checkout Session for app slug → `{ url }` |
| `/api/stripe/webhook` | POST | Stripe signature | Subscription lifecycle → upsert entitlements |
| `/api/webhooks/clerk` | POST | Clerk secret | `user.created` → insert `users` row |
| `/api/portal` | POST | Clerk session | Stripe Customer Portal session |
| `/api/entitlements` | GET | Clerk session | Caller's active entitlement slugs |
| `/api/entitlements/[slug]` | GET | Clerk session | Single entitlement check |
| `/api/coach/athletes` | GET/POST | Clerk + coach role | Roster CRUD |
| `/api/coach/athletes/[id]` | DELETE | Clerk + coach role | Revoke relationship |
| `/api/coach/invite/accept` | POST | Signed JWT token | Athlete accepts invite |
| `/api/admin/stats` | GET | Clerk + admin role | Platform KPIs |
| `/api/admin/users` | GET/PATCH | Clerk + admin role | User management |

### Webhook idempotency

Both Stripe and Clerk handlers check for duplicate event IDs before processing:

```
stripe_event_id UNIQUE in subscription_events
→ duplicate delivery silently ignored
→ no double-charge, no double-entitlement
```

---

## User Roles

| Capability | Athlete | Coach | Admin |
|---|---|---|---|
| Sign up & authenticate | ✓ | ✓ | ✓ |
| Browse app catalog | ✓ | ✓ | ✓ |
| Purchase apps / bundle | ✓ | ✓ | — |
| Use owned apps | ✓ | ✓ | ✓ |
| Manage own subscriptions | ✓ | ✓ | — |
| Invite athletes | — | ✓ | — |
| View athlete data (invited) | — | ✓ | — |
| Admin panel | — | — | ✓ |

Admin role is set via direct DB update — no self-promotion UI.

---

## Directory Structure (Implemented + Planned)

```
hub-platform/
├── app/
│   ├── layout.tsx                 ClerkProvider + ThemeProvider
│   ├── apps/page.tsx              Catalog — Prisma apps + entitlements  ✓
│   ├── app/[slug]/page.tsx        Entitlement guard + sub-app entry      ✓
│   ├── dashboard/                 Platform home
│   ├── profile/                   Subscriptions + billing
│   ├── admin/                     Admin panel
│   └── api/
│       ├── stripe/
│       │   ├── checkout/route.ts  Stripe Checkout Session               ✓
│       │   └── webhook/route.ts   Entitlements sync                      ✓
│       ├── webhooks/clerk/        User provisioning
│       ├── entitlements/          Server-side entitlement reads
│       ├── coach/                 Coach–athlete CRUD
│       └── admin/                 Platform admin
│
├── components/
│   ├── app-card.tsx               Unlock → POST checkout → redirect      ✓
│   ├── app-catalog.tsx            Client filter/search over server data  ✓
│   └── ...
│
├── lib/
│   ├── db.ts                      Prisma singleton + pg adapter           ✓
│   ├── stripe.ts                  Stripe client                          ✓
│   ├── entitlements.ts            getUserEntitlements, hasEntitlement    ✓
│   └── generated/prisma/          Generated client (gitignored)
│
├── sub-apps/                      Plug-in modules
│   ├── _template/                 Copy to add new instrument
│   ├── hrv-monitor/
│   ├── combat-tracker/
│   └── endurance-calculator/
│
├── prisma/
│   ├── schema.prisma              Full schema matching ERD above         ✓
│   └── seed.ts                    Seed apps catalog
│
└── docs/
    ├── ARCHITECTURE.md            This file
    ├── PRODUCT.md                 Product vision for Mladen
    └── CONTRIBUTING.md            Step-by-step sub-app onboarding
```

---

## Security

| Threat | Mitigation |
|---|---|
| Client fakes entitlement | Server-side DB check on every guarded route; no client-sent flags |
| Forged Stripe webhook | `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`; invalid → 400 |
| Duplicate webhook delivery | `stripe_event_id` UNIQUE in `subscription_events`; second delivery ignored |
| Coach sees uninvited athlete | Every coach query joins `coach_athletes WHERE status = 'active'` |
| Stale admin role in JWT | Admin check reads `users.role` from Postgres, not Clerk metadata |
| Invite token replay | Signed JWT with 48h TTL; `jti` single-use; token nulled on accept |

---

## Environment Variables

```bash
# Clerk — identity
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# Stripe — billing (source of truth for subscriptions)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database — Supabase Postgres
DATABASE_URL=postgresql://...pooler...     # PgBouncer (app queries)
DIRECT_URL=postgresql://...direct...       # Migrations

# App
NEXT_PUBLIC_APP_URL=https://hub.yourdomain.com

# Email (coach invites)
RESEND_API_KEY=re_...
```

---

## Roadmap

### Phase 0 — Foundations ✓ (in progress)

- [x] Next.js scaffold, shadcn/ui, Tailwind v4
- [x] Prisma schema + Supabase Postgres
- [x] Clerk auth wired
- [x] Catalog page reads live apps + entitlements
- [ ] Clerk webhook → `users` row on signup
- [ ] Middleware protecting all authenticated routes

### Phase 1 — Billing & Entitlements ✓ (core complete)

- [x] Stripe Checkout route (`/api/stripe/checkout`)
- [x] Stripe webhook → entitlements upsert
- [x] AppCard Unlock → checkout → redirect
- [x] Server-side entitlement guard on `/app/[slug]`
- [ ] Apps table seeded with Stripe Price IDs
- [ ] Stripe Customer Portal on `/profile`

### Phase 2 — HRV Monitor (first production sub-app)

- [ ] Readings table: user_id, date, rmssd, readiness_score
- [ ] Daily log UI, 7-day trend, 28-day baseline
- [ ] Coach view via accepted invite

### Phase 3 — Combat Tracker + Endurance Calculator

- [ ] Session logging, ACWR calculation, load charts
- [ ] FTP/zones/CP calculator
- [ ] Bundle subscription (one Stripe sub → three entitlements)

### Phase 4 — Coach Features + Mladen Partnership

- [ ] Coach invite flow (Resend email, signed JWT)
- [ ] Athlete roster with cross-app data view
- [ ] White-label configuration for partner brand
- [ ] Admin panel on live DB data

### Phase 5 — Production (Azure)

- [ ] Azure Container Apps deployment
- [ ] CI/CD via GitHub Actions
- [ ] Sentry + Azure Monitor
- [ ] Load test: 500 concurrent users, p99 < 800ms

---

## Summary

Hub is deliberately boring infrastructure. Auth, billing, entitlements, and coach relationships are solved once — correctly, server-side, with Stripe and Postgres as the sources of truth. Every hour of engineering goes into the instruments Mladen's athletes actually need: readiness, load, zones.

The architecture scales by **adding sub-apps**, not by rebuilding the platform. That's the pitch.
