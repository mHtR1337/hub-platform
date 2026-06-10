// TODO (Phase 0): Run with `pnpm db:seed` after Prisma is set up.
// import { PrismaClient } from '@prisma/client'
// const db = new PrismaClient()
//
// async function main() {
//   const appsData = [
//     {
//       slug: 'hrv-monitor',
//       name: 'HRV Monitor',
//       description: 'Recovery & readiness tracking via heart rate variability.',
//       priceMonthlyCents: 900,
//       stripePriceId: process.env.STRIPE_PRICE_HRV_MONITOR!,
//       sortOrder: 1,
//     },
//     {
//       slug: 'combat-tracker',
//       name: 'Combat Tracker',
//       description: 'Training load management and ACWR for fight prep.',
//       priceMonthlyCents: 1200,
//       stripePriceId: process.env.STRIPE_PRICE_COMBAT_TRACKER!,
//       sortOrder: 2,
//     },
//     {
//       slug: 'endurance-calculator',
//       name: 'Endurance Calculator',
//       description: 'FTP, training zones, and critical power.',
//       priceMonthlyCents: 700,
//       stripePriceId: process.env.STRIPE_PRICE_ENDURANCE_CALC!,
//       sortOrder: 3,
//     },
//   ]
//
//   for (const app of appsData) {
//     await db.app.upsert({ where: { slug: app.slug }, create: app, update: {} })
//     console.log(`Seeded app: ${app.slug}`)
//   }
// }
//
// main().then(() => db.$disconnect()).catch(e => { console.error(e); db.$disconnect(); process.exit(1) })

console.log('TODO: uncomment seed script after Prisma is configured')
