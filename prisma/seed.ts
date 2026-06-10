import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const appsData = [
  {
    slug: 'hrv-monitor',
    name: 'HRV Monitor',
    description: 'Recovery & readiness tracking via heart rate variability.',
    priceMonthlyCents: 900,
    // Replace with real Stripe Price IDs after creating products in Stripe dashboard.
    stripePriceId: process.env.STRIPE_PRICE_HRV_MONITOR ?? 'price_hrv_placeholder',
    sortOrder: 1,
  },
  {
    slug: 'combat-tracker',
    name: 'Combat Tracker',
    description: 'Training load management and ACWR for fight prep.',
    priceMonthlyCents: 1200,
    stripePriceId: process.env.STRIPE_PRICE_COMBAT_TRACKER ?? 'price_combat_placeholder',
    sortOrder: 2,
  },
  {
    slug: 'endurance-calculator',
    name: 'Endurance Calculator',
    description: 'FTP, training zones, and critical power.',
    priceMonthlyCents: 700,
    stripePriceId: process.env.STRIPE_PRICE_ENDURANCE_CALC ?? 'price_endurance_placeholder',
    sortOrder: 3,
  },
  {
    slug: 'bundle',
    name: 'Bundle',
    description: 'All apps — HRV Monitor, Combat Tracker, and Endurance Calculator.',
    priceMonthlyCents: 2400,
    stripePriceId: process.env.STRIPE_PRICE_BUNDLE ?? 'price_bundle_placeholder',
    sortOrder: 4,
  },
]

async function main() {
  console.log('Seeding apps...')
  for (const app of appsData) {
    await db.app.upsert({
      where: { slug: app.slug },
      create: app,
      // Don't overwrite price or Stripe IDs that may have been updated manually.
      update: { name: app.name, description: app.description, sortOrder: app.sortOrder },
    })
    console.log(`  ✓ ${app.slug}`)
  }
  console.log('Done.')
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e)
    db.$disconnect()
    process.exit(1)
  })
