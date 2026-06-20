import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

import { config } from "../lib/config"
import { PrismaClient } from "../lib/generated/prisma/client"

const appsData = [
  {
    slug: "hrv-monitor",
    name: "HRV Monitor",
    description: "Recovery & readiness tracking via heart rate variability.",
    priceMonthlyCents: 900,
    stripePriceId:
      config.stripe.prices.hrvMonitor ?? "price_hrv_placeholder",
    sortOrder: 1,
  },
  {
    slug: "combat-tracker",
    name: "Combat Tracker",
    description: "Training load management and ACWR for fight prep.",
    priceMonthlyCents: 1200,
    stripePriceId:
      config.stripe.prices.combatTracker ?? "price_combat_placeholder",
    sortOrder: 2,
  },
  {
    slug: "endurance-calculator",
    name: "Endurance Calculator",
    description: "FTP, training zones, and critical power.",
    priceMonthlyCents: 700,
    stripePriceId:
      config.stripe.prices.enduranceCalc ?? "price_endurance_placeholder",
    sortOrder: 3,
  },
  {
    slug: "bundle",
    name: "Bundle",
    description:
      "All apps — HRV Monitor, Combat Tracker, and Endurance Calculator.",
    priceMonthlyCents: 2400,
    stripePriceId: config.stripe.prices.bundle ?? "price_bundle_placeholder",
    sortOrder: 4,
  },
]

async function main() {
  const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseUrl.includes("supabase")
      ? { rejectUnauthorized: false }
      : undefined,
  })
  const adapter = new PrismaPg(pool)
  const db = new PrismaClient({ adapter })

  console.log("Seeding apps...")
  for (const app of appsData) {
    await db.app.upsert({
      where: { slug: app.slug },
      create: app,
      update: {
        name: app.name,
        description: app.description,
        sortOrder: app.sortOrder,
        stripePriceId: app.stripePriceId,
      },
    })
    console.log(`  ✓ ${app.slug}`)
  }
  console.log("Done.")

  await db.$disconnect()
  await pool.end()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
