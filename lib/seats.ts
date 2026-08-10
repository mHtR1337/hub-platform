import { db } from "@/lib/db"
import type { SeatLimits } from "@/types"

export class SeatLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SeatLimitError"
  }
}

export async function getOrganizationSeatLimits(
  organizationId: string,
): Promise<SeatLimits> {
  const [plan, coachCount, athleteCount] = await Promise.all([
    db.organizationPlan.findUnique({
      where: { organizationId },
      include: { plan: true },
    }),
    db.organizationMember.count({
      where: {
        organizationId,
        role: { in: ["admin", "coach", "staff"] },
      },
    }),
    // HSpec: athletes are org-managed records (no login). Archived do not count.
    db.athlete.count({
      where: { organizationId, archived: false },
    }),
  ])

  const template = plan?.plan
  const maxCoaches = plan?.maxCoaches ?? template?.maxCoaches ?? 1
  const maxAthletes = plan?.maxAthletes ?? template?.maxAthletes ?? 10

  return {
    maxCoaches,
    maxAthletes,
    usedCoaches: coachCount,
    usedAthletes: athleteCount,
  }
}

export async function assertCoachSeatAvailable(organizationId: string) {
  const limits = await getOrganizationSeatLimits(organizationId)
  if (limits.usedCoaches >= limits.maxCoaches) {
    throw new SeatLimitError(
      `Coach seat limit reached (${limits.maxCoaches}). Upgrade your plan to add more coaches.`,
    )
  }
}

export async function assertAthleteSeatAvailable(organizationId: string) {
  const limits = await getOrganizationSeatLimits(organizationId)
  if (limits.usedAthletes >= limits.maxAthletes) {
    throw new SeatLimitError(
      `Athlete seat limit reached (${limits.maxAthletes}). Upgrade your plan to add more athletes.`,
    )
  }
}

export async function listPlanTemplates() {
  return db.planTemplate.findMany({ orderBy: { sortOrder: "asc" } })
}

export async function assignOrganizationPlan(
  organizationId: string,
  planSlug: string,
) {
  const template = await db.planTemplate.findUnique({ where: { slug: planSlug } })
  if (!template) throw new Error("Plan not found.")

  return db.organizationPlan.upsert({
    where: { organizationId },
    create: {
      organizationId,
      planSlug,
      status: "active",
    },
    update: {
      planSlug,
      maxCoaches: null,
      maxAthletes: null,
      status: "active",
    },
  })
}
