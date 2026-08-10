import { db } from "@/lib/db"
import { DEFAULT_FLAGS, MEDICAL_STATUSES, TRAINING_STATUSES } from "@/lib/hspec"
import type {
  OrgMemberRole,
  StaffPrivilege,
  TagCategory,
  TeamMemberRole,
} from "@/types"

type OrgDb = Pick<
  typeof db,
  | "organization"
  | "organizationMember"
  | "team"
  | "teamMember"
  | "organizationPlan"
  | "tagDefinition"
  | "statusOption"
  | "flagDefinition"
>

const ADMIN_PRIVILEGES: StaffPrivilege[] = [
  "manage_org",
  "manage_roster",
  "manage_billing",
  "manage_tags",
  "view_all",
]

const STAFF_ROSTER_PRIVILEGES: StaffPrivilege[] = ["manage_roster", "view_all"]

export function parsePrivileges(raw: unknown): StaffPrivilege[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((entry): entry is StaffPrivilege => typeof entry === "string")
}

export function memberHasPrivilege(
  privileges: StaffPrivilege[],
  role: OrgMemberRole,
  required: StaffPrivilege,
): boolean {
  if (role === "admin") return true
  if (role === "coach" && required !== "manage_billing" && required !== "manage_org") {
    return true
  }
  return privileges.includes(required)
}

export async function getOrgForUser(userId: string) {
  const membership = await db.organizationMember.findFirst({
    where: { userId },
    include: {
      organization: {
        include: {
          plan: { include: { plan: true } },
          teams: { orderBy: { createdAt: "asc" } },
          tagDefinitions: { orderBy: { slug: "asc" } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  })

  return membership
    ? { membership, organization: membership.organization }
    : null
}

export async function requireOrgMembership(userId: string) {
  const result = await getOrgForUser(userId)
  if (!result) return null
  return result
}

export async function requireOrgPrivilege(
  userId: string,
  privilege: StaffPrivilege,
) {
  const result = await requireOrgMembership(userId)
  if (!result) return null

  const privileges = parsePrivileges(result.membership.privileges)
  if (
    !memberHasPrivilege(
      privileges,
      result.membership.role as OrgMemberRole,
      privilege,
    )
  ) {
    return null
  }

  return result
}

export async function bootstrapOrganizationForCoach(
  userId: string,
  input: { orgName: string; sport: string; teamName: string },
  client: OrgDb = db,
) {
  const org = await client.organization.create({
    data: {
      coachId: userId,
      name: input.orgName.trim(),
      sport: input.sport.trim(),
    },
  })

  await client.organizationMember.create({
    data: {
      organizationId: org.id,
      userId,
      role: "admin",
      privileges: ADMIN_PRIVILEGES,
    },
  })

  const team = await client.team.create({
    data: {
      organizationId: org.id,
      name: input.teamName.trim(),
    },
  })

  await client.teamMember.create({
    data: {
      teamId: team.id,
      organizationId: org.id,
      userId,
      role: "coach",
    },
  })

  await client.organizationPlan.create({
    data: {
      organizationId: org.id,
      planSlug: "starter",
    },
  })

  for (const def of [
    { slug: "sport", label: "Sport", category: "sport" satisfies TagCategory },
    { slug: "position", label: "Position", category: "position" satisfies TagCategory },
    { slug: "notes", label: "Notes", category: "descriptive" satisfies TagCategory },
  ]) {
    await client.tagDefinition.create({
      data: { organizationId: org.id, ...def },
    })
  }

  await seedOrgRegistries(org.id, client)

  return org
}

/**
 * Seed HSpec default registries (statuses + flags) for an organization.
 * Idempotent — safe to run on both new and existing organizations.
 */
export async function seedOrgRegistries(
  organizationId: string,
  client: Pick<OrgDb, "statusOption" | "flagDefinition"> = db,
) {
  await client.statusOption.createMany({
    data: [
      ...MEDICAL_STATUSES.map((s) => ({
        organizationId,
        kind: "medical",
        slug: s.slug,
        label: s.label,
        color: s.color,
        sortOrder: s.sortOrder,
      })),
      ...TRAINING_STATUSES.map((s) => ({
        organizationId,
        kind: "training",
        slug: s.slug,
        label: s.label,
        color: s.color,
        sortOrder: s.sortOrder,
      })),
    ],
    skipDuplicates: true,
  })

  await client.flagDefinition.createMany({
    data: DEFAULT_FLAGS.map((f) => ({
      organizationId,
      slug: f.slug,
      label: f.label,
      sourceApp: f.sourceApp,
      severity: f.severity,
    })),
    skipDuplicates: true,
  })
}

export async function addOrgMember(
  organizationId: string,
  userId: string,
  role: OrgMemberRole,
  privileges: StaffPrivilege[] = [],
) {
  return db.organizationMember.upsert({
    where: {
      organizationId_userId: { organizationId, userId },
    },
    create: {
      organizationId,
      userId,
      role,
      privileges:
        role === "staff" ? privileges : role === "admin" ? ADMIN_PRIVILEGES : [],
    },
    update: { role, privileges },
  })
}

export async function addTeamMember(
  teamId: string,
  organizationId: string,
  userId: string,
  role: TeamMemberRole,
) {
  return db.teamMember.upsert({
    where: {
      teamId_userId: { teamId, userId },
    },
    create: { teamId, organizationId, userId, role },
    update: { role },
  })
}

export async function createGroup(
  organizationId: string,
  teamId: string,
  name: string,
) {
  const trimmed = name.trim()
  if (!trimmed) throw new Error("Group name is required.")

  const team = await db.team.findFirst({
    where: { id: teamId, organizationId },
  })
  if (!team) throw new Error("Team not found.")

  return db.group.create({
    data: {
      teamId,
      organizationId,
      name: trimmed,
    },
  })
}

export async function addUserToGroup(groupId: string, userId: string) {
  const group = await db.group.findUniqueOrThrow({ where: { id: groupId } })
  return db.groupMember.upsert({
    where: { groupId_userId: { groupId, userId } },
    create: { groupId, userId },
    update: {},
  })
}

export async function assignMemberTag(
  organizationId: string,
  userId: string,
  tagSlug: string,
  value: string,
) {
  const def = await db.tagDefinition.findUnique({
    where: {
      organizationId_slug: { organizationId, slug: tagSlug },
    },
  })
  if (!def) throw new Error(`Tag "${tagSlug}" is not defined for this organization.`)

  return db.memberTag.upsert({
    where: {
      userId_tagDefinitionId: { userId, tagDefinitionId: def.id },
    },
    create: {
      organizationId,
      userId,
      tagDefinitionId: def.id,
      value: value.trim(),
    },
    update: { value: value.trim() },
  })
}

export async function addStaffMember(
  organizationId: string,
  userId: string,
  privileges: StaffPrivilege[] = STAFF_ROSTER_PRIVILEGES,
) {
  return addOrgMember(organizationId, userId, "staff", privileges)
}

export async function listOrgMembers(organizationId: string) {
  return db.organizationMember.findMany({
    where: { organizationId },
    include: {
      user: { select: { id: true, email: true, role: true } },
    },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  })
}

export async function listTeamRoster(teamId: string) {
  return db.teamMember.findMany({
    where: { teamId },
    include: {
      user: { select: { id: true, email: true, role: true } },
    },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  })
}

export async function listTeamGroups(teamId: string) {
  return db.group.findMany({
    where: { teamId },
    include: {
      members: {
        include: {
          user: { select: { id: true, email: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  })
}
