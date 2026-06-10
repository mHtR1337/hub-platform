# Contributing — Adding a Sub-App to Hub

This guide covers exactly how to add a new purchasable sub-application to the
Hub platform. Follow each step in order.

---

## Prerequisites

You need:
- A Stripe product + monthly price created in the Stripe dashboard
- The `stripe_price_id` (e.g. `price_1OxyzABC...`) from that price
- A slug for the app (lowercase, hyphenated, e.g. `sleep-tracker`)
- Local dev environment running (`pnpm dev`)

---

## Step 1 — Create the sub-app module

Copy the template:

```bash
cp -r sub-apps/_template sub-apps/<your-slug>
```

Edit `sub-apps/<your-slug>/config.ts`:

```typescript
import { Activity } from 'lucide-react'   // pick an icon from lucide-react

export const config = {
  slug: 'sleep-tracker',                   // must match the folder name
  name: 'Sleep Tracker',
  description: 'Log sleep quality and correlate with recovery metrics.',
  icon: Activity,                          // Lucide icon component
  priceCents: 900,                         // $9.00/mo — store in cents
  stripePriceId: 'price_1OxyzABC...',      // from Stripe dashboard
} as const
```

Edit `sub-apps/<your-slug>/index.tsx`:

```typescript
// This is the entry component rendered when a user has an active entitlement.
// The platform injects `userId` — all data fetching is your responsibility.

export default function SleepTracker({ userId }: { userId: string }) {
  return (
    <div>
      <h1>Sleep Tracker</h1>
      {/* TODO: build the actual UI */}
    </div>
  )
}
```

---

## Step 2 — Seed the database row

Add the app to `prisma/seed.ts`:

```typescript
await db.app.upsert({
  where: { slug: 'sleep-tracker' },
  create: {
    slug: 'sleep-tracker',
    name: 'Sleep Tracker',
    description: 'Log sleep quality and correlate with recovery metrics.',
    priceMonthlyCents: 900,
    stripePriceId: 'price_1OxyzABC...',
    active: true,
    sortOrder: 4,
  },
  update: {},   // never overwrite existing live data
})
```

Run the seed:

```bash
pnpm db:seed
```

The app will now appear in the catalog on the next page load.

---

## Step 3 — Wire the route

The platform already has a dynamic route at `app/app/[slug]/page.tsx` that
reads the slug and dynamically imports the sub-app. If your config file is
correct and the database row exists, routing works automatically.

Verify it by navigating to `/app/sleep-tracker` while logged in. You should see
either:
- `<Paywall />` (expected — you haven't purchased it yet), or
- The sub-app UI (if you manually seeded an entitlement for testing)

---

## Step 4 — Add test entitlement (local dev only)

To test the sub-app UI without going through Stripe Checkout locally:

```bash
pnpm db:grant-entitlement --user <your-clerk-id> --slug sleep-tracker
```

This script inserts a temporary `active` entitlement with
`current_period_end = now() + 30 days`. Never run this against production.

---

## Step 5 — Add a Stripe webhook product mapping (if needed)

Hub's Stripe webhook handler (`app/api/webhooks/stripe/route.ts`) maps Stripe
Price IDs to app slugs via the `apps` table. Because you seeded the `apps` row
with the correct `stripePriceId`, the webhook handler will automatically
associate subscription events for that price with `sleep-tracker`.

No code changes needed in the webhook handler.

---

## Step 6 — Test the full purchase flow

1. Start a local Stripe webhook listener:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

2. Navigate to `/apps` and find your new app in the catalog.

3. Click "Unlock" → complete Stripe test checkout (use card `4242 4242 4242 4242`).

4. Confirm the entitlement row exists:
   ```bash
   pnpm db:studio
   # or
   pnpm db:query "SELECT * FROM entitlements WHERE app_slug = 'sleep-tracker'"
   ```

5. Navigate to `/app/sleep-tracker` — your sub-app should render.

6. Test cancellation via Stripe Customer Portal (`/profile` → "Manage billing").

---

## Step 7 — Add sub-app-specific database tables (if needed)

If your sub-app needs its own data (most will), add tables to `prisma/schema.prisma`:

```prisma
model SleepLog {
  id        String   @id @default(uuid())
  userId    String
  date      DateTime @db.Date
  quality   Int      // 1–10
  hours     Float
  notes     String?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, date])
  @@map("sleep_logs")
}
```

Then:

```bash
pnpm db:migrate dev --name add-sleep-logs
```

---

## Checklist

Before opening a PR for a new sub-app:

- [ ] `sub-apps/<slug>/config.ts` complete with correct Stripe price ID
- [ ] `sub-apps/<slug>/index.tsx` renders something meaningful (even a stub)
- [ ] Database row seeded via `prisma/seed.ts`
- [ ] Route verified locally (paywall + unlocked state)
- [ ] Full Stripe test checkout flow completed end-to-end
- [ ] Any new DB tables migrated and committed
- [ ] No hardcoded user IDs or test data in component code

---

## Rules for sub-app developers

1. **Never implement your own auth.** Use `userId` injected by the platform.
2. **Never call the Stripe API directly.** All billing goes through
   `/api/checkout` and `/api/portal`.
3. **Never read entitlements from the client.** The `EntitlementGuard` handles
   access; do not duplicate the check inside your component.
4. **Keep sub-app state isolated.** Your DB tables use `userId` as a foreign
   key to `users`. Do not join across other sub-apps' tables.
5. **Use the shared design system.** Import from `components/ui/` and use the
   existing Tailwind tokens. Do not introduce new color variables.
6. **Follow the existing TypeScript config.** Strict mode is enabled. No `any`.
