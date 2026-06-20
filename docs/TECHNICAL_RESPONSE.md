# Hub Platform — Technical Response to Development Brief

**Document version:** 1.0  
**Date:** 18 June 2026  
**Repository:** [github.com/mHtR1337/hub-platform](https://github.com/mHtR1337/hub-platform)  
**Prepared for:** Client technical review

This document answers sections 2–8 of the software development brief. It reflects the **current implemented state** of the codebase, with explicit notes where functionality is planned, stubbed, or pending deployment.

---

## 2. Proposed Tech Stack

Hub is a **modular multi-app platform**: a shared shell provides identity, billing, entitlements, and organization management; sub-applications plug in without reimplementing cross-cutting concerns.

| Technology | Version (pinned / resolved) | Role | Why chosen for a modular multi-app platform |
|---|---|---|---|
| **Next.js** | 16.2.6 | Application framework (App Router, RSC, API routes) | Server Components run auth and entitlement checks on the server with no client bundle cost; dynamic `/app/[slug]` routing mounts sub-apps without duplicating layout or guard logic. |
| **React** | 19.x | UI runtime | Industry-standard component model; sub-apps are React modules receiving a verified `userId`. |
| **TypeScript** | 5.7.3 (strict) | Language | End-to-end typing from Prisma schema through API routes to UI reduces drift between entitlement states and UI. |
| **Tailwind CSS** | 4.2.x | Styling | Utility-first styling shared across platform shell and sub-apps via design tokens; no per-app CSS framework lock-in. |
| **shadcn/ui + Base UI** | shadcn 4.x, @base-ui/react 1.5.x | Component primitives | Accessible, copy-owned components (not a black-box npm UI kit); consistent look across all sub-apps. |
| **Clerk** | @clerk/nextjs 7.4.x | Authentication & sessions | Production-grade auth (email, OAuth, MFA-capable) with Next.js middleware integration; sub-apps never implement login. |
| **Stripe** | stripe 22.x | Payments & subscriptions (current) | Hosted Checkout and subscription webhooks; per-app Price IDs map to entitlements in Postgres. **Note:** Lemon Squeezy / Paddle (Merchant of Record) is under business review for Serbia/region compliance; not yet integrated. |
| **PostgreSQL (Supabase)** | Managed Postgres 15+ | Primary database | Relational integrity for entitlements, org membership, and seat limits; connection pooling via PgBouncer (port 6543). |
| **Prisma** | 7.8.x + @prisma/adapter-pg | ORM & migrations | Schema-as-code, typed client, migration history; lazy-init proxy avoids build-time `DATABASE_URL` requirement on Vercel. |
| **pg** | 8.21.x | Postgres driver | Required by Prisma's serverless driver adapter for Node.js runtime. |
| **Vercel** | Platform | Hosting & CI/CD | Zero-config Next.js deployment, preview URLs per branch, environment variable management. |
| **pnpm** | 9.15.9 | Package manager | Deterministic installs; monorepo-ready layout for future sub-app packages. |
| **Resend** | Planned (env var defined) | Transactional email | Coach invite emails and auth-adjacent notifications; API key slot exists in `.env.example`; **not yet wired in code**. |
| **Vercel Analytics** | 1.6.1 | Basic traffic analytics | Lightweight page-view telemetry on production; no PII. |
| **Sentry / Azure Monitor** | Planned (Phase 5) | Error tracking & APM | Documented in architecture roadmap; **not yet integrated**. |

### Why this stack supports multiple sub-applications without rebuilding auth and payments

1. **Single identity layer** — Clerk session is validated once in `proxy.ts` (Next.js 16 middleware convention). All platform routes and `/api/v1/*` mobile endpoints inherit the same session.
2. **Single billing layer** — Stripe Checkout (`POST /api/stripe/checkout`) creates subscriptions with `{ userId, appSlug }` metadata; webhooks (`POST /api/stripe/webhook`) are the **only writers** to the `entitlements` table.
3. **Single access gate** — `EntitlementGuard` calls `hasEntitlement(clerkUserId, slug)` against Postgres on every `/app/[slug]` request. Sub-apps receive `userId` only after the guard passes.
4. **Plug-in sub-app pattern** — New apps add a folder under `sub-apps/<slug>/`, a row in `apps`, and an entry in `subAppLoaders` in `app/app/[slug]/page.tsx`. No changes to auth, Stripe, or entitlement infrastructure.

---

## 3. Architecture Description

### 3.1 Authentication and permissions

**Identity provider:** Clerk (development instance: `singular-javelin-96.clerk.accounts.dev`).

**Session enforcement:** `proxy.ts` uses `clerkMiddleware()` with a route matcher. Public routes: `/`, `/login`, `/signup`, `/invite/*`, and webhook endpoints. All other routes require a valid Clerk session; unauthenticated users are redirected to `/login`.

**User provisioning:** On first platform access, onboarding flows create a `users` row linked by `clerk_id`. The Clerk webhook handler (`POST /api/webhooks/clerk`) is **stubbed (501)** — user rows are currently created via onboarding server actions, not automated webhook sync.

**Roles (two layers):**

| Layer | Storage | Values | Used for |
|---|---|---|---|
| Platform role | `users.role` + Clerk `publicMetadata.role` | `athlete`, `coach`, `admin` | Coach onboarding, admin layout gate |
| Organization role | `organization_members.role` | `admin`, `coach`, `staff`, `athlete` | Org RBAC, staff privileges, seat counting |
| Staff privileges | `organization_members.privileges` (JSONB) | e.g. `manage_roster`, `manage_billing`, `manage_tags`, `view_all` | Fine-grained org operations |

**Admin access:** `app/admin/layout.tsx` calls `requireRole('admin')`, which reads Clerk `publicMetadata.role`. **Gap:** this is not yet cross-checked against `users.role` in Postgres (documented risk in Section 6).

**Organization model (implemented in schema; migration pending production apply):** Organizations have one founding admin (`coach_id`), multiple members, teams with many coaches/athletes, groups within teams, typed tags, and seat-based plans.

### 3.2 Payments and entitlements

**Current provider:** Stripe (test mode in development).

**Checkout flow:**
1. Client calls `POST /api/stripe/checkout` with `{ appSlug }`.
2. Server resolves `apps.stripe_price_id`, creates a Stripe Checkout Session with metadata `{ userId, appSlug, clerkUserId }`.
3. User completes payment on Stripe-hosted Checkout.
4. Stripe fires webhook events to `POST /api/stripe/webhook`.

**Webhook processing:**
- Signature verified via `stripe.webhooks.constructEvent()` and `STRIPE_WEBHOOK_SECRET`.
- Idempotency enforced by unique `stripe_event_id` in `subscription_events`.
- Handled events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- Entitlements upserted in `entitlements` with status, `stripe_subscription_id`, `current_period_end`, and `cancel_at_period_end`.

**Access control:**
- `hasEntitlement()` queries Postgres: status ∈ `{active, trialing}` AND `current_period_end > now()`.
- `EntitlementGuard` wraps all sub-app routes at `/app/[slug]`.
- Client never writes or reads entitlements for access decisions.

**Future payment path:** Lemon Squeezy or Paddle (Merchant of Record) is under evaluation for Serbia/Macedonia legal entity constraints. Integration would replace or abstract the Stripe webhook writer behind a provider-agnostic entitlements interface; schema supports this without sub-app changes.

**Seat-based org plans:** `plan_templates` and `organization_plans` enforce coach/athlete limits (Starter 1/10 through Elite 5/50). Invite flows call `assertAthleteSeatAvailable()` and return HTTP 402 when limits are exceeded.

### 3.3 Database design

**Engine:** PostgreSQL on Supabase (EU region: `eu-west-3`).

**ORM:** Prisma 7 with `@prisma/adapter-pg` and lazy-init singleton in `lib/db.ts`.

**Connection strategy:**
- `DATABASE_URL` — PgBouncer pool (port 6543, `?pgbouncer=true&connection_limit=1`) for runtime queries.
- `DIRECT_URL` — Direct connection (port 5432) for Prisma migrations only.

**Key tables:**

| Table | Purpose |
|---|---|
| `users` | Platform identity; links Clerk ID to email and platform role |
| `apps` | Sub-app catalog; maps slug → Stripe Price ID |
| `entitlements` | **Source of truth** for app access per user |
| `subscription_events` | Append-only Stripe webhook audit + idempotency |
| `organizations` | Coaching business entity (name, sport, founding coach) |
| `organization_members` | Org-level RBAC (admin/coach/staff/athlete + privileges) |
| `teams` | Teams within an organization |
| `team_members` | Coaches and athletes on a team (many-to-many) |
| `groups` / `group_members` | Sub-groups within teams |
| `tag_definitions` / `member_tags` | Typed descriptive tags (sport, position, notes) |
| `plan_templates` / `organization_plans` | Seat limit catalog and per-org assignment |
| `coach_athletes` | Legacy invite/roster flow (backward compatible with new membership tables) |

**Migrations:** Four migration files in `prisma/migrations/`. Latest (`20260618203000_org_members_groups_tags_plans`) adds org membership, groups, tags, and seat plans with backfill from existing data. **Must be applied to production via `pnpm db:migrate:prod` before new org features are live.**

### 3.4 API structure

All routes live under `app/api/`. Authentication method noted per group.

#### Public (no Clerk session)

| Route | Method | Auth mechanism | Purpose |
|---|---|---|---|
| `/api/stripe/webhook` | POST | Stripe signature | Subscription lifecycle → entitlements |
| `/api/webhooks/clerk` | POST | Svix signature (planned) | User sync — **currently returns 501** |
| `/api/webhooks/stripe` | POST | Stripe signature | Legacy duplicate path |

#### Protected (Clerk session required)

| Route | Method | Additional guard | Purpose |
|---|---|---|---|
| `/api/stripe/checkout` | POST | — | Create Stripe Checkout Session |
| `/api/checkout` | POST | — | Legacy alias |
| `/api/portal` | POST | — | Stripe Customer Portal session |
| `/api/entitlements` | GET | — | Caller's active entitlement slugs |
| `/api/entitlements/[slug]` | GET | — | Single entitlement check |
| `/api/coach/athletes` | GET/POST | Clerk role = coach | List / invite athletes |
| `/api/coach/athletes/[id]` | DELETE | Clerk role = coach | Revoke athlete relationship |
| `/api/coach/invite/accept` | POST | Invite token | Accept coach invite |
| `/api/admin/stats` | GET | Admin role | Platform KPIs — **returns 501** |
| `/api/admin/users` | GET/PATCH | Admin role | User management — **stub (empty array)** |
| `/api/admin/users/[id]` | PATCH | Admin role | User update — **stub** |

#### Mobile / v1 API (Clerk session; designed for iOS/Android)

| Route | Method | Guard | Purpose |
|---|---|---|---|
| `/api/v1/me` | GET | Authenticated user | Profile + org membership |
| `/api/v1/org` | GET/POST | Org member | Org details; POST creates a group |
| `/api/v1/org/teams/[teamId]` | GET | Org member | Team roster + groups |
| `/api/v1/org/teams/[teamId]/invite` | POST | `manage_roster` privilege | Invite athlete (seat-checked) |
| `/api/v1/org/tags` | GET/POST | Org member | Tag definitions; assign tags |

Full v1 reference: `docs/API.md`.

### 3.5 Hosting and deployment

**Platform:** Vercel (`mhtr1337s-projects/hub-platform`).

**Production URL:** `https://hub-platform-jade.vercel.app`

**Build configuration (`vercel.json`):**
- Install: `pnpm install`
- Build: `pnpm run build` (`prisma generate && next build --webpack`)
- Node.js: 20.x (pinned in `package.json` `engines`; overrides Vercel project default)

**Environment variables:** Managed in Vercel Dashboard (Production + Development configured; Preview requires manual branch targeting due to CLI limitation). Secrets never committed — `.env`, `.env.local`, `.env.bulk` are gitignored.

**Deployment trigger:** Push to `main` → automatic production deploy. Feature branches → preview deploys at `hub-platform-<hash>-mhtr1337s-projects.vercel.app`.

### 3.6 Email and notifications

**Planned provider:** Resend (`RESEND_API_KEY` in `.env.example`).

**Planned use cases:**
- Coach athlete invite emails (currently invite URL is returned in API response only)
- Passwordless / auth notifications (handled by Clerk today)
- Subscription lifecycle emails (handled by Stripe today)

**Status:** Not implemented. Invite flow uses shareable URLs (`/invite/[token]`).

### 3.7 Monitoring and error tracking

| Capability | Status |
|---|---|
| Vercel Analytics | Active on production (`NODE_ENV === 'production'`) |
| Vercel function logs | Available via Dashboard / CLI |
| Sentry | Planned (Phase 5) |
| Azure Monitor | Planned (Phase 5, post-Azure migration) |
| Uptime monitoring | Not configured |
| Structured alerting | Not configured |

### 3.8 Backup and restore

**Database (Supabase):**
- Supabase Pro plans include daily automated backups with point-in-time recovery (PITR) — confirm tier with project owner.
- Manual backup: `pg_dump` against `DIRECT_URL`.
- Restore: Supabase Dashboard restore or `pg_restore` to a new project; update `DATABASE_URL` / `DIRECT_URL` in all environments.

**Application code:** GitHub is the source of truth; any commit on `main` is redeployable.

**Secrets:** Stored in Vercel environment variables and local `.env.local`; not in repository. Restore requires re-entering secrets if Vercel project is recreated.

**Recommended remaining actions:** Document RPO/RTO targets; schedule quarterly restore drill on staging; enable Supabase PITR before production launch.

### 3.9 Adding new sub-applications (plug-in pattern)

Documented in `docs/CONTRIBUTING.md`. Summary:

1. Copy `sub-apps/_template/` → `sub-apps/<slug>/`.
2. Register loader in `app/app/[slug]/page.tsx` → `subAppLoaders`.
3. Seed `apps` row in `prisma/seed.ts` with Stripe Price ID.
4. Run `pnpm db:seed` and `pnpm db:migrate:dev` if sub-app needs own tables.
5. Platform automatically provides: catalog entry, `/app/<slug>` route, entitlement guard, checkout, and webhook entitlement sync.

Sub-apps **must not** implement auth, call Stripe directly, or check entitlements client-side.

---

## 4. Existing Repositories and Accounts

| Service | Identifier | Current state | Owner / controller | Proposed access model |
|---|---|---|---|---|
| **GitHub** | [github.com/mHtR1337/hub-platform](https://github.com/mHtR1337/hub-platform) | Private repo; `main` branch; live auth, billing, coach onboarding, org schema (local), v1 API | Mihajlo Todorovski (`mHtR1337`) | Client receives read access during review; write access via PRs; transfer to client org repo on contract milestone |
| **Vercel** | `mhtr1337s-projects/hub-platform` | Production deploy at `hub-platform-jade.vercel.app`; env vars configured for Production + Development | Mihajlo Todorovski (Vercel team) | Add client stakeholder as Viewer; Developer role for designated technical contact; transfer project to client Vercel team at handover |
| **Supabase** | Project in `eu-west-3` (pooler + direct URLs in env) | Postgres live; base schema applied; latest org migration **may not yet be applied** | Mihajlo Todorovski (Supabase account) | Client owns project; developer retains migration access via service role; rotate credentials on handover |
| **Clerk** | `singular-javelin-96` (development instance) | Auth configured; embedded sign-in at `/login`; Vercel domain added | Mihajlo Todorovski (Clerk dashboard) | Production Clerk instance under client account before go-live; separate test vs live keys per environment |
| **Stripe** | Test mode keys configured | Checkout + webhook implemented; Price IDs may be placeholders in seed | Mihajlo Todorovski (Stripe account) | Client Stripe account for production; test keys for dev/staging; webhook endpoint per environment |
| **Resend** | Not configured | Env slot only | — | Client account when email is implemented |
| **Domain** | `hub-platform-jade.vercel.app` (Vercel subdomain) | Active | Vercel | Custom domain (e.g. `hub.<client-domain>.com`) on client DNS before launch |

---

## 5. Pre-existing Code and Third-Party Components

All dependencies from `package.json` (lockfile-resolved versions may differ slightly within semver ranges).

### Production dependencies

| Package | Declared version | Purpose | Licence | Commercial use | Transfer / disclosure risk |
|---|---|---|---|---|---|
| `next` | 16.2.6 | Framework | MIT | Yes | Low — standard OSS |
| `react`, `react-dom` | ^19 | UI | MIT | Yes | Low |
| `@clerk/nextjs` | ^7.4.3 | Authentication SDK | MIT (SDK) / Clerk ToS (service) | Yes, subject to Clerk SaaS terms | **Medium** — user PII processed by Clerk; DPA required for GDPR |
| `@prisma/client`, `prisma` | ^7.8.0 | ORM | Apache-2.0 | Yes | Low |
| `@prisma/adapter-pg` | ^7.8.0 | Prisma Postgres adapter | Apache-2.0 | Yes | Low |
| `pg` | ^8.21.0 | Postgres driver | MIT | Yes | Low |
| `stripe` | ^22.2.0 | Payments SDK | MIT (SDK) / Stripe Services Agreement (API) | Yes, subject to Stripe terms | **Medium** — payment data handled by Stripe; PCI scope reduced via Checkout |
| `@base-ui/react` | ^1.5.0 | Headless UI primitives | MIT | Yes | Low |
| `class-variance-authority` | ^0.7.1 | Variant styling utility | Apache-2.0 | Yes | Low |
| `clsx` | ^2.1.1 | Class name utility | MIT | Yes | Low |
| `tailwind-merge` | ^3.3.1 | Tailwind class merging | MIT | Yes | Low |
| `lucide-react` | ^1.16.0 | Icons | ISC | Yes | Low |
| `next-themes` | ^0.4.6 | Theme switching | MIT | Yes | Low |
| `tw-animate-css` | ^1.4.0 | CSS animations | MIT | Yes | Low |
| `dotenv` | ^17.4.2 | Env loading (Prisma CLI) | BSD-2-Clause | Yes | Low |
| `@vercel/analytics` | 1.6.1 | Analytics | MPL-2.0 | Yes (MPL file-level) | Low — page views only |
| `shadcn` | ^4.8.0 | CLI / codegen tooling | MIT | Yes | Low — components are copied into repo |

### Development dependencies

| Package | Declared version | Purpose | Licence | Commercial use | Risk |
|---|---|---|---|---|---|
| `typescript` | 5.7.3 | Type checking | Apache-2.0 | Yes | Low |
| `tailwindcss`, `@tailwindcss/postcss` | ^4.2.0 | CSS framework | MIT | Yes | Low |
| `postcss` | ^8.5 | CSS processing | MIT | Yes | Low |
| `tsx` | ^4.22.4 | TS script runner (seed) | MIT | Yes | Low |
| `@types/node`, `@types/react`, `@types/react-dom`, `@types/pg` | various | Type definitions | MIT | Yes | Low |

### First-party / scaffolded code

| Location | Origin | Notes |
|---|---|---|
| `sub-apps/*` | Project-authored | Stub sub-app modules (HRV, Combat, Endurance) |
| `components/ui/*` | shadcn/ui (copied) | MIT — owned in repo after generation |
| `lib/admin.ts`, `lib/account.ts` | Project-authored | **Mock data** — admin panel and account summary strip not yet wired to live DB |

### Items flagged for legal review

| Item | Reason | Action |
|---|---|---|
| **Clerk SaaS Terms + DPA** | Processes user email, auth metadata; EU users | Execute Clerk DPA; document sub-processor in privacy policy |
| **Stripe Services Agreement** | Processes payment data | Confirm entity jurisdiction (Serbia/MK/HR); may require alternative MoR |
| **Supabase data residency** | User PII in Postgres (EU-West-3) | Confirm adequacy for client jurisdiction; sign Supabase DPA |
| **Lemon Squeezy / Paddle** (if adopted) | MoR model changes tax liability | Legal review before integration |
| **@vercel/analytics (MPL-2.0)** | Weak copyleft on MPL files only | Acceptable for commercial use; no modification of MPL files planned |
| **Placeholder Stripe Price IDs** | `price_*_placeholder` in seed | Must not reach production — replace with live Price IDs |

No GPL/AGPL dependencies identified in the production dependency tree.

---

## 6. Security and Privacy Risk Register

| # | Risk | Likelihood | Impact | Current mitigation | Remaining action |
|---|---|---|---|---|---|
| 1 | **Authentication bypass** — unauthenticated access to protected routes | Low | Critical | `proxy.ts` Clerk middleware on all non-public routes; API routes call `auth()` | Add automated tests for route coverage; verify `/api/v1/*` in middleware matcher |
| 2 | **Entitlement bypass** — access sub-app without subscription | Low | High | Server-side `hasEntitlement()` in `EntitlementGuard`; webhooks only writer | Add integration tests per slug; audit sub-app routes for guard bypass |
| 3 | **Cross-app entitlement leakage** — paying for app A, accessing app B | Low | High | Entitlements keyed by `user_id + app_slug`; guard checks specific slug | None beyond testing |
| 4 | **Stripe webhook spoofing** | Medium | Critical | `constructEvent()` signature verification; 400 on invalid signature | Rotate webhook secret per environment; monitor failed signature attempts |
| 5 | **Duplicate webhook processing** — double entitlements | Medium | Medium | Unique `stripe_event_id` in `subscription_events` | Verify idempotency in integration tests |
| 6 | **SQL injection** | Low | Critical | Prisma parameterized queries exclusively; no raw SQL in application code | Keep raw SQL out of codebase; periodic dependency audit |
| 7 | **Secrets exposure in repository** | Medium | Critical | `.gitignore` excludes `.env*`; Vercel env vars for deploy | Audit git history; add secret scanning (GitHub Advanced Security or gitleaks); never commit `.env.bulk` |
| 8 | **Secrets exposure at runtime** | Low | Critical | Server-only env vars; `NEXT_PUBLIC_*` limited to publishable keys | Review all `NEXT_PUBLIC_` vars; no secrets in client bundle |
| 9 | **GDPR / data privacy** | Medium | High | Data in Supabase EU; Clerk as auth processor | Publish privacy policy; sign DPAs (Clerk, Supabase, Stripe); implement data export/delete endpoints |
| 10 | **Admin route exposure** | Medium | High | `requireRole('admin')` in admin layout | **Migrate admin check to `users.role` in Postgres**; stub admin API returns 501 but UI may render mock data |
| 11 | **Admin role via Clerk metadata tampering** | Low | Critical | Clerk metadata set server-side on onboarding | Do not trust metadata alone — enforce DB role for admin |
| 12 | **Coach accessing uninvited athlete data** | Low | High | Queries join `coach_athletes WHERE status = active` | Extend checks to `organization_members` as legacy table is phased out |
| 13 | **Invite token replay** | Low | Medium | Token nulled on accept; email match enforced | Add TTL expiry; rate-limit accept endpoint |
| 14 | **Seat limit bypass** | Low | Medium | `assertAthleteSeatAvailable()` on invite/accept | Enforce on all roster-add paths including staff UI |
| 15 | **Dependency vulnerabilities** | Medium | Medium | pnpm lockfile; Prisma/Stripe/Clerk actively maintained | Enable Dependabot or Renovate; monthly `pnpm audit` |
| 16 | **Account takeover** | Low | Critical | Clerk MFA-capable; session managed by Clerk | Enable MFA for admin/coach roles; monitor Clerk dashboard for anomalies |
| 17 | **Missing Clerk webhook** — orphaned auth users | Medium | Low | Onboarding creates DB user on first flow | Implement `POST /api/webhooks/clerk` with Svix verification |
| 18 | **Serverless connection exhaustion** | Medium | Medium | PgBouncer pool URL with `connection_limit=1` | Monitor Supabase connection count; tune pool size under load |
| 19 | **Build without DATABASE_URL** | Low | Low | Lazy Prisma proxy in `lib/db.ts` | Document that runtime requires DATABASE_URL on Vercel |

---

## 7. Proposed Environments

Three-environment model aligned with Vercel and Supabase capabilities.

### 7.1 Development (local)

| Attribute | Value |
|---|---|
| **URL** | `http://localhost:3000` |
| **Database** | Supabase dev project **or** dedicated local Postgres (recommended: separate Supabase project to avoid polluting staging/prod) |
| **Clerk** | Development instance (`pk_test_…` / `sk_test_…`); `$DEVHOST` = `http://localhost:3000` |
| **Stripe** | Test mode (`sk_test_…`); Stripe CLI for webhook forwarding: `stripe listen --forward-to localhost:3000/api/stripe/webhook` |
| **Email** | Not sent; invite URLs logged / copied manually |
| **Deploy trigger** | Manual: `pnpm dev` |
| **Secrets** | `.env.local` (gitignored), never committed |

### 7.2 Staging

| Attribute | Value |
|---|---|
| **URL** | `https://hub-platform-<branch>-mhtr1337s-projects.vercel.app` (Vercel preview) or dedicated `staging.<domain>` |
| **Database** | Separate Supabase project (recommended) with staging data; migrations applied via `pnpm db:migrate:prod` in CI before deploy |
| **Clerk** | Same development instance **or** dedicated staging Clerk app; preview domains added to allowed origins |
| **Stripe** | Test mode keys |
| **Email** | Resend test domain (when implemented) |
| **Deploy trigger** | Push to `staging` branch or any PR branch (Vercel preview) |
| **Access** | Team-only; Vercel deployment protection (password / SSO) recommended for client demos |
| **Purpose** | Mirrors production architecture; safe client UAT; migration smoke tests |

### 7.3 Production

| Attribute | Value |
|---|---|
| **URL** | `https://hub-platform-jade.vercel.app` (interim); custom domain TBD |
| **Database** | Supabase production project (`eu-west-3`); PITR enabled |
| **Clerk** | Production instance (`pk_live_…`) with custom domain configured |
| **Stripe** | Live mode (`sk_live_…`) **or** Lemon Squeezy/Paddle when legal entity confirmed |
| **Email** | Resend production domain with SPF/DKIM |
| **Deploy trigger** | Merge to `main` → automatic Vercel production deploy |
| **Secrets** | Vercel Production environment variables only; rotated on handover |
| **Monitoring** | Vercel Analytics + Sentry (when enabled) |

### Environment comparison matrix

| | Development | Staging | Production |
|---|---|---|---|
| **URL pattern** | `localhost:3000` | `*.vercel.app` preview | Custom domain |
| **Database** | Dev Supabase / local | Staging Supabase | Production Supabase |
| **Clerk** | Test/dev instance | Test or staging app | Live instance |
| **Payments** | Stripe test | Stripe test | Stripe live / MoR |
| **Deploy** | Manual | Branch push / PR | Merge to `main` |
| **Real user data** | No | Test accounts only | Yes |

---

## 8. Source Control and Release Process

### 8.1 Branching strategy

| Branch | Purpose | Deploys to |
|---|---|---|
| `main` | Production-ready code | Vercel Production |
| `staging` (proposed) | Pre-release integration | Vercel Preview (pinned) or staging URL |
| `feature/*`, `fix/*` | Individual changes | Vercel Preview (ephemeral) |
| Tags `v*.*.*` | Release markers | Reference only; deploy still from `main` |

### 8.2 Pull request and review process

Even as a solo or small team:

1. All changes go through a feature branch — no direct commits to `main` for release-bound work.
2. PR description must state: schema changes (yes/no), env var changes (yes/no), migration required (yes/no).
3. Self-review checklist before merge: build passes (`pnpm build`), no secrets in diff, migration file included if schema changed.
4. Client stakeholder may be added as GitHub reviewer for milestone acceptance.

### 8.3 Release tagging and deployment

1. Merge approved PR to `main`.
2. Vercel auto-builds and deploys to production.
3. Tag release: `git tag v1.2.0 && git push origin v1.2.0`.
4. Record release notes in GitHub Releases (features, migrations, env var changes).

### 8.4 Rollback procedure

| Scenario | Action |
|---|---|
| **Bad application deploy** | Vercel Dashboard → Deployments → select last known-good deploy → **Promote to Production** (instant rollback, no rebuild) |
| **Bad database migration** | Do **not** rollback migrations automatically. Write a forward migration to revert schema changes. Restore DB from Supabase PITR backup if data corruption occurred. |
| **Bad env var** | Revert variable in Vercel Dashboard → Redeploy |

### 8.5 Database migration safety

**Rule: migrate before deploy.**

1. Merge migration SQL in PR (`prisma/migrations/<timestamp>_<name>/migration.sql`).
2. Before or immediately after merge, run `pnpm db:migrate:prod` against target environment database (via CI step or manual with `DIRECT_URL`).
3. Vercel build runs `prisma generate` (not `migrate deploy`) — migration must already be applied.
4. Destructive migrations require explicit backup confirmation and staging validation first.

**Proposed CI step (not yet implemented):**

```yaml
# On merge to main, before Vercel deploy:
- run: pnpm db:migrate:prod
  env:
    DIRECT_URL: ${{ secrets.DIRECT_URL }}
```

### 8.6 Secrets and credentials management

| Secret | Development | Staging | Production |
|---|---|---|---|
| Clerk keys | `.env.local` | Vercel Preview env | Vercel Production env |
| Stripe keys | `.env.local` (test) | Vercel Preview (test) | Vercel Production (live) |
| Database URLs | `.env.local` | Vercel Preview | Vercel Production |
| Webhook secrets | Stripe CLI / Clerk dashboard | Per-environment endpoints | Per-environment endpoints |
| `ADMIN_SECRET` | Local only | Staging | Production (rotate from default) |

**Rules:**
- Never commit secrets; `.env.bulk` is a local paste template only.
- Rotate all secrets on team member departure or repo handover.
- Use separate Stripe webhook endpoints per environment (different signing secrets).

---

## Appendix A — Implementation Status Summary

Accurate as of 18 June 2026. Supersedes stale statements in `README.md`.

| Area | Status |
|---|---|
| Clerk auth + middleware (`proxy.ts`) | **Live** |
| User onboarding (athlete / coach) | **Live** |
| Organization + teams + invites | **Live** (legacy + new membership model) |
| Org members, groups, tags, seat plans | **Schema + code ready**; migration pending prod apply |
| Stripe Checkout + webhook → entitlements | **Live** (requires real Price IDs for checkout) |
| Entitlement guard on sub-apps | **Live** |
| Sub-app modules (HRV, Combat, Endurance) | **Stub UI only** |
| Mobile API (`/api/v1/*`) | **Live** |
| Clerk webhook user sync | **Not implemented (501)** |
| Admin panel API + live data | **Not implemented (mock data in UI)** |
| Resend email invites | **Not implemented** |
| Lemon Squeezy / Paddle | **Under business review; not in code** |
| Sentry / advanced monitoring | **Planned** |
| Custom production domain | **Not configured** |

---

## Appendix B — Document references

| Document | Path |
|---|---|
| Architecture | `docs/ARCHITECTURE.md` |
| Product specification | `docs/PRODUCT.md` |
| Sub-app contribution guide | `docs/CONTRIBUTING.md` |
| Mobile / v1 API reference | `docs/API.md` |
| Environment template | `.env.example` |

---

*End of document.*
