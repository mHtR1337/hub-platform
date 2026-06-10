# Hub Platform — Architecture

## Product Overview

Hub is a multi-tenant SaaS **platform shell** that hosts independent, purchasable
sports-science sub-applications. It does not contain application logic itself —
it provides identity, billing, and entitlements infrastructure so that sub-apps
can plug in with minimal ceremony.

The core separation:

```
Platform shell          Sub-apps
────────────────        ──────────────────────────────
Auth (Clerk)            HRV Monitor       /app/hrv-monitor
Billing (Stripe)        Combat Tracker    /app/combat-tracker
Entitlements            Endurance Calc    /app/endurance-calculator
Admin dashboard
```

**The platform answers one question per request**: "does this user hold an active
entitlement for this slug?" If yes, the sub-app renders. If no, it shows a
paywall. Sub-apps never implement their own auth or billing.

**Target users**: Performance athletes who want data-driven training tools, and
coaches who manage multiple athletes and need a unified view across all apps.

---

## User Roles & Permissions Matrix

| Capability | Athlete | Coach |
|---|---|---|
| Sign up & authenticate | ✓ | ✓ |
| Browse app catalog | ✓ | ✓ |
| Purchase individual apps | ✓ | ✓ |
| Purchase bundle | ✓ | ✓ |
| Use owned apps | ✓ | ✓ |
| Manage own subscriptions | ✓ | ✓ |
| Invite athletes | ✗ | ✓ |
| View athlete list | ✗ | ✓ |
| View athlete data (per app) | ✗ | ✓ (only accepted invites) |
| Access admin panel | ✗ | ✗ |
| Access admin panel | ✗ *(admin role only)* | ✗ |

### Coach–Athlete Relationship

1. Coach sends invite by email from their dashboard.
2. Platform creates a `coach_athletes` row with `status: pending`.
3. Athlete receives email (Resend), clicks accept link (signed JWT, 48h TTL).
4. Row updates to `status: active`.
5. Coach can now read athlete data for any app the **coach** holds an
   entitlement for — the coach's entitlement, not the athlete's, gates access.
6. Coach can revoke the relationship at any time; athlete can also remove
   themselves. Row is soft-deleted (status → `revoked`).

Coaches never see athletes who have not accepted the invite. Server-side
enforcement: every athlete-data query joins on `coach_athletes` and filters
`status = 'active'`.

---

## Technical Architecture

### Stack

| Layer | Choice | Justification |
|---|---|---|
| Framework | Next.js 15 App Router | RSC for zero-bundle server queries; nested layouts for platform shell + sub-app shell; excellent Vercel/Azure support |
| Language | TypeScript (strict) | End-to-end type safety; shared types between DB layer and UI |
| Styling | Tailwind CSS v4 + shadcn/ui | Utility-first with a consistent component primitive layer; dark mode trivial |
| Auth | Clerk | Handles session, JWTs, webhooks, MFA, social login out of the box; ~30 min to production |
| Database | PostgreSQL (Azure Database for PostgreSQL Flexible Server) | Relational constraints matter for entitlements correctness; Prisma gives type-safe queries |
| ORM | Prisma | Schema-as-code, migrations, typed client; works well with Next.js |
| Payments | Stripe | Industry standard; Checkout + Customer Portal handles all subscription lifecycle |
| Email | Resend | Simple API, React Email templates, generous free tier |
| Hosting | Azure Static Web Apps (front-end) + Azure Container Apps (API) | Target production environment |
| Package manager | pnpm | Faster installs, strict hoisting prevents phantom dependencies |

### System Diagram

```
Browser
  │
  ▼
Next.js App Router (platform shell)
  │
  ├── /app/* pages (authenticated, entitlement-guarded)
  │     │
  │     ├── Middleware (Clerk session check)
  │     │       └── if no session → /login
  │     │
  │     └── EntitlementGuard (server component)
  │               └── if no entitlement → <Paywall />
  │                       └── if entitlement active → <SubAppShell />
  │
  ├── /api/webhooks/clerk      (user.created → insert users row)
  ├── /api/webhooks/stripe     (subscription events → update entitlements)
  ├── /api/entitlements        (GET — server-side check, never client-trusted)
  ├── /api/coach/athletes      (coach-athlete CRUD)
  └── /api/admin/*             (admin-only endpoints)
  
  │
  ▼
Prisma ORM
  │
  ▼
PostgreSQL (Azure Flexible Server)
```

### Data Flow: User Buys an App

```
1. User clicks "Unlock" on an AppCard
2. POST /api/checkout { appSlug }
   └── server creates Stripe Checkout Session
   └── returns { url }
3. Browser redirects to Stripe Checkout
4. User completes payment
5. Stripe fires webhook → POST /api/webhooks/stripe
   └── verifies signature (STRIPE_WEBHOOK_SECRET)
   └── on checkout.session.completed:
         INSERT entitlements (user_id, app_slug, status='active', ...)
6. User lands on /checkout/success
7. Next visit to /app/[slug] → EntitlementGuard reads DB → active → renders app
```

---

## Database Schema (PostgreSQL)

```sql
-- Users are created by Clerk webhook; we store only what we need locally.
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id        TEXT NOT NULL UNIQUE,
  email           TEXT NOT NULL UNIQUE,
  role            TEXT NOT NULL DEFAULT 'athlete' CHECK (role IN ('athlete', 'coach', 'admin')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX users_clerk_id_idx ON users (clerk_id);

-- Static catalog — seeded, not user-generated.
CREATE TABLE apps (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT NOT NULL UNIQUE,   -- 'hrv-monitor', 'combat-tracker', etc.
  name                TEXT NOT NULL,
  description         TEXT NOT NULL,
  price_monthly_cents INTEGER NOT NULL,       -- store as cents to avoid float issues
  stripe_price_id     TEXT NOT NULL UNIQUE,   -- live Stripe Price ID
  active              BOOLEAN NOT NULL DEFAULT true,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per user–app subscription. Source of truth for access.
CREATE TABLE entitlements (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_slug                 TEXT NOT NULL REFERENCES apps(slug) ON DELETE RESTRICT,
  status                   TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  stripe_subscription_id   TEXT NOT NULL UNIQUE,
  stripe_customer_id       TEXT NOT NULL,
  current_period_end       TIMESTAMPTZ NOT NULL,
  cancel_at_period_end     BOOLEAN NOT NULL DEFAULT false,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX entitlements_user_id_idx ON entitlements (user_id);
CREATE INDEX entitlements_user_slug_idx ON entitlements (user_id, app_slug);
CREATE INDEX entitlements_stripe_sub_idx ON entitlements (stripe_subscription_id);

-- Coach–athlete relationships.
CREATE TABLE coach_athletes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  athlete_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  invite_token TEXT UNIQUE,                   -- null once accepted
  invited_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at  TIMESTAMPTZ,
  CONSTRAINT coach_athletes_unique UNIQUE (coach_id, athlete_id)
);
CREATE INDEX coach_athletes_coach_idx ON coach_athletes (coach_id);
CREATE INDEX coach_athletes_athlete_idx ON coach_athletes (athlete_id);

-- Audit trail for all subscription events (append-only).
CREATE TABLE subscription_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_slug        TEXT NOT NULL,
  event_type      TEXT NOT NULL,   -- 'created', 'updated', 'canceled', 'payment_failed', etc.
  stripe_event_id TEXT NOT NULL UNIQUE,
  payload         JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## API Routes Architecture

All routes live under `app/api/`. Protected routes verify Clerk session via
`auth()` from `@clerk/nextjs/server`. Admin routes additionally check
`user.role = 'admin'` from the database.

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/webhooks/clerk` | POST | Webhook secret | `user.created` → upsert `users` row |
| `/api/webhooks/stripe` | POST | Stripe signature | Subscription lifecycle → update `entitlements` |
| `/api/checkout` | POST | Session | Create Stripe Checkout Session for an app slug |
| `/api/portal` | POST | Session | Create Stripe Customer Portal session |
| `/api/entitlements` | GET | Session | Return caller's active entitlement slugs |
| `/api/entitlements/[slug]` | GET | Session | Check single entitlement (used by middleware) |
| `/api/coach/athletes` | GET | Session + Coach role | List coach's athletes |
| `/api/coach/athletes` | POST | Session + Coach role | Send invite to athlete email |
| `/api/coach/athletes/[id]` | DELETE | Session + Coach role | Revoke athlete relationship |
| `/api/coach/invite/accept` | POST | Public (signed token) | Athlete accepts invite |
| `/api/admin/stats` | GET | Session + Admin role | Platform KPIs |
| `/api/admin/users` | GET | Session + Admin role | Paginated user list |
| `/api/admin/users/[id]` | PATCH | Session + Admin role | Update user role/status |

### Webhook Idempotency

Both webhook handlers check `stripe_event_id` (or Clerk event ID) against
`subscription_events` before processing. Duplicate delivery is silently ignored.

---

## Entitlements System

This is the security core of the platform. The rules:

1. **Never trust the client.** The browser never sends "I have access to X".
   Every guarded page checks the database server-side.

2. **Middleware handles auth; EntitlementGuard handles access.**
   - `middleware.ts` (Clerk) blocks unauthenticated users at the edge.
   - `EntitlementGuard` (React Server Component) does the DB check and renders
     either the sub-app or `<Paywall />`.

3. **Stripe webhooks are the only writer.** Nothing else updates `entitlements`.
   After a successful checkout, the client polls `/api/entitlements` (or uses a
   short-lived SSE stream) until the webhook has fired and the row appears.

4. **`current_period_end` is the expiry clock.** Even if the webhook is delayed,
   the guard also checks `current_period_end > now()`. This prevents a race
   condition where a canceled subscription briefly appears active.

5. **Coach access is additive, not substitutive.** A coach reading athlete data
   goes through: session valid + coach role + coach_athletes active + coach
   holds entitlement for the app. All four must pass.

### Entitlement Guard (simplified)

```typescript
// components/entitlement-guard.tsx (Server Component)
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { Paywall } from './paywall'

export async function EntitlementGuard({
  slug,
  children,
}: {
  slug: string
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) return <Paywall slug={slug} />

  const entitlement = await db.entitlement.findFirst({
    where: {
      user: { clerkId: userId },
      appSlug: slug,
      status: { in: ['active', 'trialing'] },
      currentPeriodEnd: { gt: new Date() },
    },
  })

  if (!entitlement) return <Paywall slug={slug} />
  return <>{children}</>
}
```

---

## Directory Structure

```
hub-platform/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (ClerkProvider, ThemeProvider)
│   ├── page.tsx                      # → redirect /dashboard
│   ├── globals.css
│   │
│   ├── (auth)/                       # Auth route group (no sidebar)
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   │
│   ├── (platform)/                   # Authenticated shell (sidebar + topbar)
│   │   ├── layout.tsx                # AppShell wrapper
│   │   ├── dashboard/page.tsx
│   │   ├── apps/page.tsx
│   │   └── profile/page.tsx
│   │
│   ├── app/                          # Sub-app routes (entitlement-guarded)
│   │   └── [slug]/
│   │       ├── layout.tsx            # EntitlementGuard + SubAppShell
│   │       └── page.tsx              # Sub-app entry point
│   │
│   ├── admin/                        # Admin panel (admin role only)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   └── api/                          # API routes
│       ├── webhooks/
│       │   ├── clerk/route.ts
│       │   └── stripe/route.ts
│       ├── checkout/route.ts
│       ├── portal/route.ts
│       ├── entitlements/
│       │   ├── route.ts
│       │   └── [slug]/route.ts
│       ├── coach/
│       │   ├── athletes/route.ts
│       │   ├── athletes/[id]/route.ts
│       │   └── invite/accept/route.ts
│       └── admin/
│           ├── stats/route.ts
│           └── users/
│               ├── route.ts
│               └── [id]/route.ts
│
├── components/
│   ├── ui/                           # shadcn primitives (untouched)
│   ├── platform/                     # Platform-level components
│   │   ├── app-shell.tsx
│   │   ├── hub-sidebar.tsx
│   │   ├── top-bar.tsx
│   │   ├── entitlement-guard.tsx     # THE core guard
│   │   ├── paywall.tsx               # Shown when no entitlement
│   │   └── sub-app-shell.tsx         # Wrapper rendered inside the guard
│   ├── catalog/                      # App catalog components
│   │   ├── app-card.tsx
│   │   ├── app-catalog.tsx
│   │   └── bundle-banner.tsx
│   ├── billing/                      # Billing components
│   │   ├── billing-card.tsx
│   │   └── subscriptions-table.tsx
│   ├── account/                      # Account/profile components
│   │   ├── account-info-card.tsx
│   │   └── account-summary-strip.tsx
│   ├── admin/                        # Admin-only components
│   │   ├── admin-stat-cards.tsx
│   │   ├── users-table.tsx
│   │   └── subscriptions-by-app.tsx
│   └── shared/                       # Truly shared primitives
│       ├── section-header.tsx
│       ├── status-badge.tsx
│       └── theme-toggle.tsx
│
├── lib/
│   ├── db.ts                         # Prisma client singleton
│   ├── stripe.ts                     # Stripe client + helpers
│   ├── clerk.ts                      # Clerk helpers (currentUser, requireRole)
│   ├── entitlements.ts               # getEntitlements(), hasEntitlement()
│   ├── apps.ts                       # Static app catalog (types + seed data)
│   ├── app-icons.ts                  # Icon map
│   └── utils.ts                      # cn(), formatPrice(), etc.
│
├── sub-apps/                         # Sub-app modules
│   ├── _template/                    # Copy this to add a new sub-app
│   │   ├── index.tsx                 # Entry component
│   │   ├── config.ts                 # slug, name, icon, price
│   │   └── README.md
│   ├── hrv-monitor/
│   │   ├── index.tsx
│   │   └── config.ts
│   ├── combat-tracker/
│   │   ├── index.tsx
│   │   └── config.ts
│   └── endurance-calculator/
│       ├── index.tsx
│       └── config.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                       # Seed apps table
│
├── hooks/
│   ├── use-mobile.ts
│   ├── use-entitlements.ts           # Client-side entitlement cache
│   └── use-coach-athletes.ts
│
├── types/
│   └── index.ts                      # Shared TypeScript types
│
├── middleware.ts                     # Clerk auth middleware
│
├── docs/
│   ├── ARCHITECTURE.md               # This file
│   ├── PRODUCT.md
│   └── CONTRIBUTING.md
│
├── .env.example
├── .env.local                        # gitignored
├── next.config.mjs
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── components.json
└── README.md
```

### Adding a New Sub-App

The atomic unit is `sub-apps/<slug>/`. A sub-app provides:

1. `config.ts` — metadata (slug, name, description, icon, Stripe price ID,
   price in cents).
2. `index.tsx` — the React entry component. Receives `userId` as a prop; all
   data fetching is the sub-app's responsibility.

The platform automatically:

- Adds it to the catalog when `apps.active = true` in the database.
- Guards the route at `/app/[slug]` via `EntitlementGuard`.
- Handles all checkout/cancel/billing flows.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the exact step-by-step.

---

## Environment Variables

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...          # from Clerk dashboard → webhooks

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...         # from Stripe dashboard → webhooks

# Database
DATABASE_URL=postgresql://user:pass@host:5432/hub_production

# App
NEXT_PUBLIC_APP_URL=https://hub.yourdomain.com

# Email (Resend)
RESEND_API_KEY=re_...

# Internal
ADMIN_SECRET=...                        # used to seed/bootstrap admin user
```

---

## Development Roadmap

### Phase 0 — Foundations *(current)*
- [x] Next.js 15 scaffold with shadcn/ui, Tailwind v4
- [x] All UI pages mocked with static data
- [ ] Clerk auth wired (sign-in, sign-up, session)
- [ ] Postgres + Prisma schema applied and migrated
- [ ] `users` row created on Clerk webhook
- [ ] Middleware protecting `/dashboard`, `/apps`, `/profile`, `/app/*`

**Acceptance**: A real user can sign up, log in, and reach the dashboard. The
database has their row. `/login` redirects correctly after auth.

### Phase 1 — Billing & Entitlements POC
- [ ] `apps` table seeded with all four products + Stripe Price IDs
- [ ] Checkout route creates Stripe session
- [ ] Stripe webhook creates/updates `entitlements` row
- [ ] `EntitlementGuard` renders `<Paywall />` or sub-app based on DB
- [ ] Stripe Customer Portal wired to `/profile`
- [ ] `cancel_at_period_end` displayed in subscriptions table

**Acceptance**: A user can purchase HRV Monitor, be redirected back, and
immediately access `/app/hrv-monitor`. Canceling via portal updates the
entitlement within seconds (webhook).

### Phase 2 — First Real Sub-App (HRV Monitor)
- [ ] HRV Monitor data model (readings table: user_id, date, rmssd, hrv_score)
- [ ] HRV Monitor UI: log reading, trend chart, readiness score
- [ ] Coach can see athlete's HRV data (requires accepted invite)
- [ ] Mobile-responsive sub-app layout

**Acceptance**: An athlete can log an HRV reading. A coach who has the app and
an accepted invite can view the athlete's readings. Data persists across
sessions.

### Phase 3 — Remaining Sub-Apps
- [ ] Combat Tracker (training sessions, ACWR calculation)
- [ ] Endurance Calculator (FTP, zones, critical power curve)
- [ ] Bundle subscription (one Stripe subscription, all three slugs unlocked)

**Acceptance**: All three apps functional. Bundle purchase unlocks all three
with a single Stripe subscription.

### Phase 4 — Coach Features & Polish
- [ ] Coach invite flow (email via Resend)
- [ ] Coach dashboard: athlete roster, per-athlete data view across all apps
- [ ] Notifications (in-app: payment failed, invite accepted)
- [ ] Admin panel wired to real DB data
- [ ] Onboarding flow (role selection after first sign-up)

**Acceptance**: A coach can invite an athlete by email. Athlete accepts, coach
sees their data. Admin sees live MRR and user counts.

### Phase 5 — Azure Production
- [ ] Azure Container Apps deployment (Next.js standalone)
- [ ] Azure Database for PostgreSQL Flexible Server (production + read replica)
- [ ] Azure Blob Storage for any user-uploaded assets
- [ ] CI/CD via GitHub Actions → Azure Container Registry
- [ ] Custom domain, SSL, Cloudflare in front
- [ ] Error monitoring (Sentry), logging (Azure Monitor)
- [ ] Load testing (k6) at 500 concurrent users

**Acceptance**: Production deployment passing load tests. Error rate < 0.1%.
p99 latency < 800ms on dashboard page.

---

## Security Considerations

### Entitlements are never trusted from the client
No cookie, localStorage value, or client-side flag grants access. Every guarded
route performs a DB read on the server. The entitlement check costs ~1ms on a
warm Prisma connection — acceptable.

### Stripe webhook signature verification
Every incoming Stripe webhook is verified with `stripe.webhooks.constructEvent()`
using `STRIPE_WEBHOOK_SECRET`. Any request with an invalid signature returns 400
immediately without processing.

### Coach data isolation
Coach queries always join `coach_athletes ON (coach_id = :coachId AND status =
'active')`. There is no code path that returns athlete data without this join.
The ORM layer enforces it — raw SQL is not used for these queries.

### Admin route protection
`/admin` routes check `user.role = 'admin'` from the database (not from Clerk's
`publicMetadata`, which could be stale). Admin users are set via direct DB
update or a seeded bootstrap script; there is no UI to self-promote.

### Invite token security
Coach invite tokens are signed JWTs (HS256, `INVITE_SECRET`) with a 48-hour
expiry and a `jti` that is single-use (stored and checked on accept). Accepting
a token nulls out the `invite_token` column.

### Webhook idempotency
Both Clerk and Stripe webhook handlers are idempotent. Duplicate events are
detected via `stripe_event_id` uniqueness in `subscription_events` and silently
ignored.
