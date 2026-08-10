import { db } from "@/lib/db"
import { seedOrgRegistries } from "@/lib/organization"

/** Resolve the caller's primary organization (coach-owned or first membership). */
export async function getOrgContext(userId: string) {
  const owned = await db.organization.findUnique({
    where: { coachId: userId },
    include: { teams: { orderBy: { createdAt: "asc" } }, plan: true },
  })
  if (owned) return { organization: owned, membershipRole: "admin" as const }

  const membership = await db.organizationMember.findFirst({
    where: { userId },
    include: {
      organization: {
        include: { teams: { orderBy: { createdAt: "asc" } }, plan: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  })
  if (!membership) return null
  return {
    organization: membership.organization,
    membershipRole: membership.role,
  }
}

export async function listAthletesForOrg(organizationId: string, teamId?: string) {
  return db.athlete.findMany({
    where: {
      organizationId,
      archived: false,
      ...(teamId ? { activeTeamId: teamId } : {}),
    },
    include: {
      groups: { include: { group: true } },
      flags: {
        where: { status: "active" },
        include: { definition: true },
        take: 8,
      },
      notes: { orderBy: { createdAt: "desc" }, take: 5 },
    },
    orderBy: { name: "asc" },
  })
}

export async function createAthlete(input: {
  organizationId: string
  name: string
  position?: string
  sex?: string
  activeTeamId?: string | null
  medicalStatus?: string
  trainingStatus?: string
  actorId?: string
}) {
  const name = input.name.trim()
  if (!name) throw new Error("Athlete name is required.")

  await seedOrgRegistries(input.organizationId)

  const athlete = await db.athlete.create({
    data: {
      organizationId: input.organizationId,
      name,
      position: input.position?.trim() ?? "",
      sex: input.sex?.trim() ?? "",
      activeTeamId: input.activeTeamId ?? null,
      medicalStatus: input.medicalStatus ?? "available-no-issues",
      trainingStatus: input.trainingStatus ?? "full-training-competition",
    },
  })

  if (input.activeTeamId) {
    await db.athleteTeamHistory.create({
      data: {
        athleteId: athlete.id,
        teamId: input.activeTeamId,
      },
    })
  }

  await db.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorId: input.actorId ?? null,
      sourceApp: "hub",
      action: "athlete.create",
      resourceType: "athlete",
      resourceId: athlete.id,
      newValue: { name: athlete.name, trainingStatus: athlete.trainingStatus },
    },
  })

  return athlete
}

export async function updateAthleteTrainingStatus(input: {
  athleteId: string
  organizationId: string
  trainingStatus: string
  actorId?: string
  source?: string
  reason?: string
}) {
  const athlete = await db.athlete.findFirst({
    where: { id: input.athleteId, organizationId: input.organizationId },
  })
  if (!athlete) throw new Error("Athlete not found.")
  if (athlete.trainingStatus === input.trainingStatus) return athlete

  const updated = await db.athlete.update({
    where: { id: athlete.id },
    data: { trainingStatus: input.trainingStatus },
  })

  await db.statusChange.create({
    data: {
      athleteId: athlete.id,
      kind: "training",
      oldValue: athlete.trainingStatus,
      newValue: input.trainingStatus,
      reason: input.reason ?? "",
      source: input.source ?? "visual-board",
      actorId: input.actorId ?? null,
    },
  })

  await db.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorId: input.actorId ?? null,
      sourceApp: "hub",
      action: "athlete.training_status.update",
      resourceType: "athlete",
      resourceId: athlete.id,
      oldValue: { trainingStatus: athlete.trainingStatus },
      newValue: { trainingStatus: input.trainingStatus },
      reason: input.reason ?? "",
    },
  })

  return updated
}

export async function updateAthleteMedicalStatus(input: {
  athleteId: string
  organizationId: string
  medicalStatus: string
  actorId?: string
  source?: string
  reason?: string
}) {
  const athlete = await db.athlete.findFirst({
    where: { id: input.athleteId, organizationId: input.organizationId },
  })
  if (!athlete) throw new Error("Athlete not found.")
  if (athlete.medicalStatus === input.medicalStatus) return athlete

  const updated = await db.athlete.update({
    where: { id: athlete.id },
    data: { medicalStatus: input.medicalStatus },
  })

  await db.statusChange.create({
    data: {
      athleteId: athlete.id,
      kind: "medical",
      oldValue: athlete.medicalStatus,
      newValue: input.medicalStatus,
      reason: input.reason ?? "",
      source: input.source ?? "athlete-drawer",
      actorId: input.actorId ?? null,
    },
  })

  await db.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorId: input.actorId ?? null,
      sourceApp: "hub",
      action: "athlete.medical_status.update",
      resourceType: "athlete",
      resourceId: athlete.id,
      oldValue: { medicalStatus: athlete.medicalStatus },
      newValue: { medicalStatus: input.medicalStatus },
      reason: input.reason ?? "",
    },
  })

  return updated
}
