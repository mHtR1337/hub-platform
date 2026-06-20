# Production Infrastructure (Phase 5 — planned)

> **Status:** Not built yet. This document describes the target production architecture.
> Dev and test environments are live today (local + Vercel). Prod will migrate off Vercel
> to containerized hosting with managed Postgres.

See also: [`docs/ENVIRONMENTS.md`](../docs/ENVIRONMENTS.md) for env var checklists and deployment triggers.

---

## Overview

| Layer | dev | test | prod (planned) |
|---|---|---|---|
| **Compute** | `pnpm dev` locally | Vercel | Azure Container Apps **or** AWS ECS Fargate |
| **Database** | Supabase dev | Supabase staging | Azure Database for PostgreSQL **or** AWS RDS |
| **CDN / WAF** | — | Vercel edge | Azure Front Door **or** CloudFront |
| **Secrets** | `.env.local` | Vercel env | Azure Key Vault **or** AWS Secrets Manager |
| **Observability** | — | Vercel logs | Azure Monitor **or** CloudWatch + Sentry |
| **IaC** | — | — | Terraform (tf-local Docker runner) |

The repo includes a production-ready [`Dockerfile`](../Dockerfile) that works on both Azure and AWS.

---

## Option A — Azure

```
                    ┌─────────────────────┐
                    │  Azure Front Door   │  CDN, TLS, WAF
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Container Apps     │  Hub Next.js (Dockerfile)
                    │  (auto-scale)       │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
┌────────▼────────┐  ┌─────────▼─────────┐  ┌───────▼────────┐
│ Key Vault       │  │ PostgreSQL        │  │ Azure Monitor  │
│ (secrets)       │  │ Flexible Server   │  │ + Sentry       │
└─────────────────┘  └───────────────────┘  └────────────────┘
```

### Components

| Service | Purpose |
|---|---|
| **Azure Container Apps** | Run the Docker image; scale on HTTP load; zero-downtime revisions |
| **Azure Database for PostgreSQL Flexible Server** | Managed Postgres; private VNet endpoint; automated backups |
| **Azure Front Door** | Global CDN, TLS termination, optional WAF rules |
| **Azure Key Vault** | `DATABASE_URL`, `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, etc. |
| **Azure Monitor** | Container logs, metrics, alerts |
| **Azure Container Registry** | Store built Docker images from CI |

### Deployment flow (planned)

1. CI builds Docker image from `main` (or release tag)
2. Push image to ACR
3. Run `pnpm db:migrate:prod` against prod `DIRECT_URL` (CI job or init container)
4. Update Container Apps revision with new image + Key Vault secret refs
5. Front Door routes traffic to new revision

---

## Option B — AWS

```
                    ┌─────────────────────┐
                    │  CloudFront         │  CDN, TLS
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Application LB     │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  ECS Fargate        │  Hub Next.js (Dockerfile)
                    │  (auto-scale)       │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
┌────────▼────────┐  ┌─────────▼─────────┐  ┌───────▼────────┐
│ Secrets Manager │  │ RDS PostgreSQL    │  │ CloudWatch     │
│ (secrets)       │  │ (Multi-AZ)        │  │ + Sentry       │
└─────────────────┘  └───────────────────┘  └────────────────┘
```

### Components

| Service | Purpose |
|---|---|
| **ECS Fargate** | Serverless containers; no EC2 management |
| **RDS PostgreSQL** | Managed Postgres; Multi-AZ; automated backups |
| **CloudFront + ALB** | CDN and load balancing |
| **Secrets Manager** | Runtime secrets injected as ECS task env |
| **CloudWatch** | Logs, metrics, alarms |
| **ECR** | Docker image registry |

### Deployment flow (planned)

1. CI builds and pushes image to ECR
2. Run migrations against prod `DIRECT_URL`
3. ECS service rolling update with new task definition
4. CloudFront invalidation if static assets change

---

## Terraform (planned)

Infrastructure will be provisioned with **Terraform**, using the **tf-local Docker runner** pattern:

- Terraform runs inside a pinned Docker image (consistent versions across dev/CI)
- State stored remotely (Azure Storage **or** S3 + DynamoDB lock)
- Separate workspaces or directories per environment: `dev`, `test`, `prod`
- Modules: `network`, `database`, `container`, `cdn`, `secrets`, `monitoring`

```
infrastructure/
├── README.md          ← this file
├── terraform/         ← (future) modules and env configs
│   ├── modules/
│   ├── envs/dev/
│   ├── envs/test/
│   └── envs/prod/
└── scripts/           ← (future) tf-local wrappers
```

Nothing under `infrastructure/terraform/` exists yet — add when Phase 5 starts.

---

## Secrets mapping (prod)

| Env var | Source |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | Key Vault / Secrets Manager (from managed Postgres) |
| `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` | Key Vault / Secrets Manager |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Key Vault / Secrets Manager |
| `RESEND_API_KEY` | Key Vault / Secrets Manager |
| `SENTRY_DSN` | Key Vault / Secrets Manager |
| `NEXT_PUBLIC_*` | Baked at **Docker build** via `--build-arg` (not secret) |
| `NEXT_PUBLIC_APP_ENV=prod` | Build arg |

**Database password:** use alphanumeric-only passwords in managed Postgres (see `docs/ENVIRONMENTS.md`).

---

## Migration from Vercel (test → prod)

1. **test** stays on Vercel until prod is validated
2. Provision prod infra (Terraform Phase 5)
3. Create prod Clerk application (live keys)
4. Create prod Stripe products (live mode)
5. Migrate data: Supabase staging → managed Postgres (pg_dump / pg_restore) or fresh prod seed
6. Point DNS to Front Door / CloudFront
7. Decommission Vercel prod deployment (test can remain on Vercel indefinitely)

---

## Local Docker smoke test

```bash
docker build \
  --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... \
  -t hub-platform .

docker run -p 3000:3000 --env-file .env.local hub-platform
```

Requires a reachable `DATABASE_URL` at runtime (not just build placeholders).

---

## Related docs

- [`docs/ENVIRONMENTS.md`](../docs/ENVIRONMENTS.md) — three-environment strategy
- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) — application architecture
- [`Dockerfile`](../Dockerfile) — production container build
