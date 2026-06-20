# Hub Platform — production Docker image
# Works on Azure Container Apps and AWS ECS Fargate.
#
# Build (pass real NEXT_PUBLIC_* at build time; runtime secrets via platform):
#   docker build \
#     --build-arg NEXT_PUBLIC_APP_URL=https://app.example.com \
#     --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... \
#     -t hub-platform .
#
# Run:
#   docker run -p 3000:3000 --env-file .env.production hub-platform

# -----------------------------------------------------------------------------
# Stage 1: production dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc* ./
RUN pnpm install --frozen-lockfile --prod

# -----------------------------------------------------------------------------
# Stage 2: build
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc* ./
RUN pnpm install --frozen-lockfile

COPY . .

# Build-time placeholders — override with --build-arg in CI.
# Runtime secrets are injected by Container Apps / ECS / Key Vault.
ARG NEXT_PUBLIC_APP_ENV=prod
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_build_placeholder
ARG CLERK_SECRET_KEY=sk_build_placeholder
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
ARG DIRECT_URL=postgresql://build:build@localhost:5432/build
ARG PAYMENT_PROVIDER=stripe

ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    CLERK_SECRET_KEY=$CLERK_SECRET_KEY \
    DATABASE_URL=$DATABASE_URL \
    DIRECT_URL=$DIRECT_URL \
    PAYMENT_PROVIDER=$PAYMENT_PROVIDER

RUN pnpm prisma generate && pnpm run build

# Keep only production node_modules for the runner image
RUN pnpm prune --prod

# -----------------------------------------------------------------------------
# Stage 3: runner
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/lib/generated ./lib/generated

USER nextjs
EXPOSE 3000

CMD ["pnpm", "start"]
