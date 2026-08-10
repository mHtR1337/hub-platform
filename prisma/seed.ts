import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

import { config } from "../lib/config"
import { DEFAULT_FLAGS, MEDICAL_STATUSES, TRAINING_STATUSES } from "../lib/hspec"
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

  console.log("Seeding HSpec registries for existing organizations...")
  const orgs = await db.organization.findMany({ select: { id: true, name: true } })
  for (const org of orgs) {
    await db.statusOption.createMany({
      data: [
        ...MEDICAL_STATUSES.map((s) => ({
          organizationId: org.id,
          kind: "medical",
          slug: s.slug,
          label: s.label,
          color: s.color,
          sortOrder: s.sortOrder,
        })),
        ...TRAINING_STATUSES.map((s) => ({
          organizationId: org.id,
          kind: "training",
          slug: s.slug,
          label: s.label,
          color: s.color,
          sortOrder: s.sortOrder,
        })),
      ],
      skipDuplicates: true,
    })
    await db.flagDefinition.createMany({
      data: DEFAULT_FLAGS.map((f) => ({
        organizationId: org.id,
        slug: f.slug,
        label: f.label,
        sourceApp: f.sourceApp,
        severity: f.severity,
      })),
      skipDuplicates: true,
    })
    console.log(`  ✓ registries for ${org.name}`)
  }

  console.log("Seeding sample athletes if roster empty...")
  for (const org of orgs) {
    const count = await db.athlete.count({ where: { organizationId: org.id } })
    if (count > 0) continue

    const team = await db.team.findFirst({
      where: { organizationId: org.id },
      orderBy: { createdAt: "asc" },
    })
    const samples = [
      { name: "Jack Miller", position: "Flanker", trainingStatus: "modified-full-training", medicalStatus: "available-symptomatic" },
      { name: "Noah Bennett", position: "Lock", trainingStatus: "special-program", medicalStatus: "modified-symptomatic" },
      { name: "Oscar Brown", position: "Fullback", trainingStatus: "full-training-competition", medicalStatus: "available-asymptomatic" },
      { name: "Alex Reid", position: "Flyhalf", trainingStatus: "full-training-competition", medicalStatus: "available-no-issues" },
      { name: "Callum Hayes", position: "Hooker", trainingStatus: "full-training-reserve", medicalStatus: "available-no-issues" },
      { name: "Liam O’Connor", position: "Back Row", trainingStatus: "away-holiday", medicalStatus: "available-no-issues" },
    ]
    for (const s of samples) {
      const athlete = await db.athlete.create({
        data: {
          organizationId: org.id,
          activeTeamId: team?.id ?? null,
          name: s.name,
          position: s.position,
          trainingStatus: s.trainingStatus,
          medicalStatus: s.medicalStatus,
        },
      })
      if (team) {
        await db.athleteTeamHistory.create({
          data: { athleteId: athlete.id, teamId: team.id },
        })
      }
    }
    console.log(`  ✓ sample athletes for ${org.name}`)
  }
  console.log("Done.")

  await db.$disconnect()
  await pool.end()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
