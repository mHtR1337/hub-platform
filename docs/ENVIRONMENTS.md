# Environments

Hub Platform runs in three environments. Each has its own database, auth instance, and deployment target. Environment-specific values live in env vars — never hard-coded.

| | **dev** | **test** (staging) | **prod** |
|---|---|---|---|
| **Purpose** | Local development | Pre-production QA / client demos | Live users |
| **App host** | `localhost:3000` | Vercel (staging project or branch) | Azure Container Apps or AWS ECS |
| **Database** | Supabase dev project | Supabase staging project | Azure Database for PostgreSQL or AWS RDS |
| **Auth** | Clerk development instance | Clerk development instance | Clerk production instance |
| **Payments** | Stripe test mode | Stripe test mode | Stripe live mode |
| **Email** | Resend (optional locally) | Resend | Resend |
| **Monitoring** | — | — | Sentry + cloud APM |

Set `NEXT_PUBLIC_APP_ENV=dev|test|prod` in every environment so the app and logs know which tier is running.

---

## dev — local

### What runs where

- Next.js dev server on your machine (`pnpm dev`)
- Supabase Postgres (free/dev project)
- Clerk development keys
- Stripe test keys (checkout works with test cards)

### Setup from scratch

1. Clone the repo and install dependencies: `pnpm install`
2. Copy env template: `cp .env.example .env.local`
3. Set `NEXT_PUBLIC_APP_ENV=dev` and `NEXT_PUBLIC_APP_URL=http://localhost:3000`
4. Create a **Supabase dev project** → Settings → Database → copy **Prisma** connection strings into `DATABASE_URL` and `DIRECT_URL`
5. Use an **alphanumeric-only** database password (see password rule below)
6. Create a **Clerk development** application → copy publishable + secret keys
7. (Optional) Add Stripe test keys and Price IDs, then run `pnpm db:seed`
8. Apply migrations: `pnpm db:migrate` (creates/applies dev migrations)
9. Start: `pnpm dev`

### Env checklist (dev)

- [ ] `NEXT_PUBLIC_APP_ENV=dev`
- [ ] `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- [ ] `DATABASE_URL`, `DIRECT_URL`
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- [ ] Clerk routing vars (`NEXT_PUBLIC_CLERK_*`)
- [ ] `PAYMENT_PROVIDER=stripe`
- [ ] `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional until billing is tested)
- [ ] `STRIPE_PRICE_*` + `pnpm db:seed` (optional)
- [ ] `RESEND_API_KEY` (optional)

---

## test — staging

### What runs where

- **Vercel** hosts the Next.js app (preview or dedicated staging deployment)
- **Supabase staging project** (separate from dev — never share prod/staging data)
- **Clerk development** instance (same as dev, or a dedicated staging Clerk app)
- **Stripe test mode**

### Setup from scratch

1. Create a **Supabase staging project** (new project, not the dev one)
2. Apply migrations against staging: set `DIRECT_URL` to staging, run `pnpm db:migrate:prod`
3. Seed if needed: `pnpm db:seed` (with staging `DATABASE_URL`)
4. In **Vercel** → Project → Settings → Environment Variables:
   - Set all vars for **Preview** and/or a dedicated **Development** environment
   - `NEXT_PUBLIC_APP_ENV=test`
   - `NEXT_PUBLIC_APP_URL` = your staging URL (e.g. `https://hub-platform-staging.vercel.app`)
5. Push to the staging branch or trigger a Vercel deploy

### Env checklist (test)

- [ ] `NEXT_PUBLIC_APP_ENV=test`
- [ ] `NEXT_PUBLIC_APP_URL` = staging URL
- [ ] `DATABASE_URL`, `DIRECT_URL` (Supabase **staging** project)
- [ ] Clerk **dev** keys (`pk_test_` / `sk_test_`)
- [ ] `PAYMENT_PROVIDER=stripe`
- [ ] Stripe **test** keys + webhook secret (point webhook to `https://<staging>/api/webhooks/stripe`)
- [ ] `STRIPE_PRICE_*` (test mode prices)
- [ ] `RESEND_API_KEY`
- [ ] `CLERK_WEBHOOK_SECRET` (Clerk webhook → staging URL)

### Deployment trigger

- **Git push** to staging branch → Vercel automatic deploy
- Or manual **Redeploy** in Vercel dashboard after env var changes (`NEXT_PUBLIC_*` requires redeploy)

---

## prod — production

### What runs where

- **Azure Container Apps** or **AWS ECS Fargate** (Docker image from repo `Dockerfile`)
- **Managed Postgres**: Azure Database for PostgreSQL Flexible Server or AWS RDS PostgreSQL
- **Clerk production** instance (`pk_live_` / `sk_live_`)
- **Stripe live mode**
- **Sentry** for error tracking
- Secrets in **Azure Key Vault** or **AWS Secrets Manager** (not plain Vercel env for prod long-term)

> Production infrastructure is **Phase 5** — see `infrastructure/README.md`. The Dockerfile and env layout are ready; cloud provisioning is not built yet.

### Setup from scratch (when infra exists)

1. Provision Postgres (RDS / Azure Flexible Server) with alphanumeric app password
2. Run migrations: `DIRECT_URL=<prod-direct> pnpm db:migrate:prod`
3. Create Clerk **production** application; configure allowed origins and webhook URLs
4. Create Stripe **live** products/prices; set live keys and webhook secret
5. Build and push Docker image; deploy to Container Apps / ECS with env from Key Vault / Secrets Manager
6. Set `NEXT_PUBLIC_APP_ENV=prod` and production `NEXT_PUBLIC_APP_URL`

### Env checklist (prod)

- [ ] `NEXT_PUBLIC_APP_ENV=prod`
- [ ] `NEXT_PUBLIC_APP_URL` = production domain
- [ ] `DATABASE_URL`, `DIRECT_URL` (managed Postgres, SSL required)
- [ ] Clerk **live** keys
- [ ] `CLERK_WEBHOOK_SECRET`
- [ ] `PAYMENT_PROVIDER=stripe`
- [ ] Stripe **live** keys + webhook secret
- [ ] `STRIPE_PRICE_*` (live prices)
- [ ] `RESEND_API_KEY`
- [ ] `SENTRY_DSN`
- [ ] `ADMIN_SECRET` (strong random value, rotation policy)

### Deployment trigger

- **CI/CD pipeline** builds Docker image → pushes to registry → updates Container Apps / ECS service
- Database migrations run as a **pre-deploy job** or manual step with prod `DIRECT_URL` (never from local `.env.local`)

---

## Database migrations

| Environment | Command | Connection var |
|---|---|---|
| dev (local) | `pnpm db:migrate` | `DIRECT_URL` from `.env.local` |
| test / prod | `pnpm db:migrate:prod` | `DIRECT_URL` for that environment |

Prisma reads `DIRECT_URL` via `prisma.config.ts`. Always run migrations against the **target** database before or during deploy.

**Seed** (apps catalog): `pnpm db:seed` — uses `DATABASE_URL`. Safe to re-run; upserts app rows.

---

## Database password rule

Supabase and Postgres connection URLs embed the password in the URI. Characters like `$`, `&`, `#`, and `@` must be URL-encoded; mistakes cause misleading errors (e.g. `ENOTFOUND tenant/user not found`).

**Recommendation:** reset the database password to **alphanumeric only** (letters and numbers).

Supabase: Dashboard → **Settings** → **Database** → **Reset database password**

---

## Switching payment provider

Only one provider is active at a time, controlled by `PAYMENT_PROVIDER`.

| Value | Status |
|---|---|
| `stripe` | **Active** — checkout and webhooks use Stripe |
| `paddle` | Stubbed — not implemented |
| `lemon_squeezy` | Stubbed — not implemented |

To switch (when additional providers are implemented):

1. Implement provider module under `lib/payments/`
2. Set `PAYMENT_PROVIDER=<provider>` in the target environment
3. Add provider API keys to env / secrets store
4. Configure provider webhooks to `/api/webhooks/<provider>`
5. Redeploy

No application code changes should be required beyond env vars once the provider is wired in `lib/payments/`.

---

## Adding a new environment variable safely

1. Add the var to **`.env.example`** with a comment (which envs need it, dev vs live values)
2. Document it in this file under the relevant env checklist
3. Read it in **`lib/config.ts`** only — do not use `process.env` elsewhere
4. Add validation (required vs optional) in `lib/config.ts`
5. Set the value in:
   - `.env.local` (dev)
   - Vercel / Key Vault / Secrets Manager (test/prod)
6. For `NEXT_PUBLIC_*` vars: redeploy after changing (baked in at build time)
7. Never commit secrets; never log secret values

---

## Quick reference — env files

| File | Purpose | Committed? |
|---|---|---|
| `.env.example` | Template + documentation | Yes |
| `.env.local` | Local overrides (dev) | **No** (gitignored) |
| `.env` | Shared defaults (optional) | Usually no |
| Vercel / Key Vault / Secrets Manager | test & prod secrets | Never in git |
