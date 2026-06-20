import { randomUUID } from "node:crypto"

import { config } from "@/lib/config"
import { db } from "@/lib/db"
import { assertAthleteSeatAvailable } from "@/lib/seats"
import { requireCoachOrganization } from "@/lib/users"
import type { CoachAthleteStatus, StaffPrivilege } from "@/types"

type MemberDb = Pick<typeof db, "organizationMember" | "teamMember">

export { SeatLimitError } from "@/lib/seats"

async function addOrgMemberTx(
  organizationId: string,
  userId: string,
  role: "athlete" | "coach" | "staff" | "admin",
  client: MemberDb,
  privileges: StaffPrivilege[] = [],
) {
  return client.organizationMember.upsert({
    where: {
      organizationId_userId: { organizationId, userId },
    },
    create: { organizationId, userId, role, privileges },
    update: { role, privileges },
  })
}

async function addTeamMemberTx(
  teamId: string,
  organizationId: string,
  userId: string,
  role: "coach" | "athlete",
  client: MemberDb,
) {
  return client.teamMember.upsert({
    where: { teamId_userId: { teamId, userId } },
    create: { teamId, organizationId, userId, role },
    update: { role },
  })
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function inviteUrlForToken(token: string) {
  return `${config.appUrl}/invite/${token}`
}

export async function listCoachRoster(coachUserId: string) {
  return db.coachAthlete.findMany({
    where: {
      coachId: coachUserId,
      status: { not: "revoked" },
    },
    include: {
      athlete: { select: { id: true, email: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: { invitedAt: "desc" },
  })
}

export async function inviteAthleteToTeam(
  coachUserId: string,
  input: { email: string; teamId?: string },
) {
  const email = normalizeEmail(input.email)
  if (!email.includes("@")) {
    throw new Error("Enter a valid email address.")
  }

  const org = await requireCoachOrganization(coachUserId)
  if (!org) {
    throw new Error("Complete coach setup before inviting athletes.")
  }

  const teamId = input.teamId ?? org.teams[0]?.id
  if (!teamId) {
    throw new Error("Create a team before inviting athletes.")
  }

  const team = org.teams.find((entry) => entry.id === teamId)
  if (!team) {
    throw new Error("Team not found.")
  }

  const existingInvite = await db.coachAthlete.findFirst({
    where: {
      coachId: coachUserId,
      inviteEmail: email,
      status: { in: ["pending", "active"] },
    },
  })
  if (existingInvite) {
    throw new Error("This athlete is already on your roster or invited.")
  }

  const existingUser = await db.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  })

  if (existingUser) {
    const linked = await db.coachAthlete.findFirst({
      where: {
        coachId: coachUserId,
        athleteId: existingUser.id,
        status: { in: ["pending", "active"] },
      },
    })
    if (linked) {
      throw new Error("This athlete is already on your roster.")
    }

    await assertAthleteSeatAvailable(org.id)
  }

  const inviteToken = randomUUID()

  const row = await db.$transaction(async (tx) => {
    if (existingUser) {
      await addOrgMemberTx(org.id, existingUser.id, "athlete", tx)
      await addTeamMemberTx(teamId, org.id, existingUser.id, "athlete", tx)
    }

    return tx.coachAthlete.create({
      data: {
        coachId: coachUserId,
        teamId,
        inviteEmail: email,
        athleteId: existingUser?.id ?? null,
        status: existingUser ? "active" : "pending",
        inviteToken: existingUser ? null : inviteToken,
        acceptedAt: existingUser ? new Date() : null,
      },
      include: {
        athlete: { select: { id: true, email: true } },
        team: { select: { id: true, name: true } },
      },
    })
  })

  return {
    row,
    inviteUrl: existingUser ? null : inviteUrlForToken(inviteToken),
  }
}

export async function createTeamForCoach(
  coachUserId: string,
  name: string,
) {
  const trimmed = name.trim()
  if (!trimmed) throw new Error("Team name is required.")

  const org = await requireCoachOrganization(coachUserId)
  if (!org) {
    throw new Error("Complete coach setup before creating teams.")
  }

  return db.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        organizationId: org.id,
        name: trimmed,
      },
    })

    await addTeamMemberTx(team.id, org.id, coachUserId, "coach", tx)

    return team
  })
}

export async function revokeCoachAthlete(
  coachUserId: string,
  relationshipId: string,
) {
  const row = await db.coachAthlete.findFirst({
    where: { id: relationshipId, coachId: coachUserId },
  })
  if (!row) throw new Error("Athlete not found on your roster.")

  return db.coachAthlete.update({
    where: { id: relationshipId },
    data: { status: "revoked" satisfies CoachAthleteStatus },
  })
}

export async function acceptCoachInvite(token: string, athleteUserId: string) {
  const invite = await db.coachAthlete.findFirst({
    where: { inviteToken: token, status: "pending" },
    include: {
      coach: { select: { id: true, organization: { select: { id: true } } } },
      team: { select: { id: true, organizationId: true } },
    },
  })
  if (!invite) throw new Error("Invite not found or already used.")

  const athlete = await db.user.findUniqueOrThrow({
    where: { id: athleteUserId },
  })

  const inviteEmail = invite.inviteEmail?.toLowerCase()
  if (inviteEmail && inviteEmail !== athlete.email.toLowerCase()) {
    throw new Error(
      "Sign in with the email address your coach invited before accepting.",
    )
  }

  const orgId = invite.coach.organization?.id
  if (!orgId) throw new Error("Organization not found for this invite.")

  await assertAthleteSeatAvailable(orgId)

  return db.$transaction(async (tx) => {
    await addOrgMemberTx(orgId, athlete.id, "athlete", tx)
    if (invite.teamId) {
      await addTeamMemberTx(
        invite.teamId,
        invite.team?.organizationId ?? orgId,
        athlete.id,
        "athlete",
        tx,
      )
    }

    return tx.coachAthlete.update({
      where: { id: invite.id },
      data: {
        athleteId: athlete.id,
        status: "active",
        inviteToken: null,
        acceptedAt: new Date(),
      },
    })
  })
}

export async function getInvitePreview(token: string) {
  return db.coachAthlete.findFirst({
    where: { inviteToken: token, status: "pending" },
    include: {
      coach: {
        select: {
          email: true,
          organization: { select: { name: true, sport: true } },
        },
      },
      team: { select: { name: true } },
    },
  })
}
