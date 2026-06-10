// TODO (Phase 1): Real entitlement queries. These are the only functions that
// should read the entitlements table — do not query it inline elsewhere.
//
// export async function getEntitlements(clerkId: string): Promise<string[]> {
//   const rows = await db.entitlement.findMany({
//     where: {
//       user: { clerkId },
//       status: { in: ['active', 'trialing'] },
//       currentPeriodEnd: { gt: new Date() },
//     },
//     select: { appSlug: true },
//   })
//   return rows.map(r => r.appSlug)
// }
//
// export async function hasEntitlement(clerkId: string, slug: string): Promise<boolean> {
//   const row = await db.entitlement.findFirst({
//     where: {
//       user: { clerkId },
//       appSlug: slug,
//       status: { in: ['active', 'trialing'] },
//       currentPeriodEnd: { gt: new Date() },
//     },
//   })
//   return row !== null
// }

export async function getEntitlements(_clerkId: string): Promise<string[]> {
  return [] // stub
}

export async function hasEntitlement(_clerkId: string, _slug: string): Promise<boolean> {
  return false // stub
}
