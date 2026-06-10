import { db } from "@/lib/db"

const ACTIVE_STATUSES = ["active", "trialing"] as const

export async function getUserEntitlements(clerkUserId: string): Promise<string[]> {
  const entitlements = await db.entitlement.findMany({
    where: {
      user: { clerkId: clerkUserId },
      status: { in: [...ACTIVE_STATUSES] },
      currentPeriodEnd: { gt: new Date() },
    },
    select: { appSlug: true },
  })

  return entitlements.map((e) => e.appSlug)
}

export async function hasEntitlement(
  clerkUserId: string,
  appSlug: string,
): Promise<boolean> {
  const entitlement = await db.entitlement.findFirst({
    where: {
      user: { clerkId: clerkUserId },
      appSlug,
      status: { in: [...ACTIVE_STATUSES] },
      currentPeriodEnd: { gt: new Date() },
    },
    select: { id: true },
  })

  return entitlement !== null
}
