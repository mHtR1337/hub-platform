# Hub Platform

The app store for serious athletes. Hub is a multi-tenant SaaS platform that
hosts independent, purchasable sports-science tools under one account, one
billing relationship, and one shared identity.

## Sub-apps

| App | Price | Description |
|---|---|---|
| HRV Monitor | $9/mo | Daily readiness scoring via heart rate variability |
| Combat Tracker | $12/mo | Training load management and ACWR for fight prep |
| Endurance Calculator | $7/mo | FTP, training zones, and critical power |
| Bundle | $24/mo | All three apps |

## Stack

- **Next.js 15** (App Router, React Server Components)
- **TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui**
- **Clerk** — auth
- **Stripe** — payments & subscriptions
- **Prisma** + **PostgreSQL** — database
- **Resend** — transactional email
- **pnpm** — package manager

## Getting started

```bash
pnpm install
cp .env.example .env.local
# fill in .env.local with your Clerk, Stripe, and database credentials
pnpm db:migrate dev
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Documentation

| Doc | Description |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Full technical architecture, DB schema, API routes, entitlements system, roadmap |
| [docs/PRODUCT.md](docs/PRODUCT.md) | Product vision, personas, feature list, user flows, pricing |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | How to add a new sub-app to the platform |

## Current state

The UI is fully scaffolded with mock data (see `lib/apps.ts`, `lib/account.ts`,
`lib/admin.ts`). Real auth (Clerk), database (Prisma + Postgres), and payments
(Stripe) are not wired yet — that is Phase 0 and Phase 1 work per the roadmap.

## Project structure

```
app/            Next.js routes (platform shell + sub-app routes + API)
components/     React components (platform/, catalog/, billing/, admin/, ui/)
lib/            Shared utilities, DB client, Stripe client, entitlements helpers
sub-apps/       One folder per sub-application module
prisma/         Schema and migrations
docs/           Architecture, product, and contribution documentation
```
