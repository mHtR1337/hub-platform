import { NextResponse } from "next/server"

import { apiError, requireApiUser } from "@/lib/api-auth"
import { getOrgForUser, listOrgMembers } from "@/lib/organization"
import { getOrganizationSeatLimits, listPlanTemplates } from "@/lib/seats"
import { db } from "@/lib/db"

export async function GET() {
  const auth = await requireApiUser()
  if ("error" in auth) return auth.error

  const orgContext = await getOrgForUser(auth.user.id)
  if (!orgContext) return apiError("No organization membership.", 404)

  const { organization, membership } = orgContext
  const [members, seats, plans] = await Promise.all([
    listOrgMembers(organization.id),
    getOrganizationSeatLimits(organization.id),
    listPlanTemplates(),
  ])

  return NextResponse.json({
    organization: {
      id: organization.id,
      name: organization.name,
      sport: organization.sport,
      memberRole: membership.role,
      plan: organization.plan
        ? {
            slug: organization.plan.planSlug,
            name: organization.plan.plan.name,
            status: organization.plan.status,
            limits: seats,
          }
        : null,
      teams: organization.teams.map((team) => ({
        id: team.id,
        name: team.name,
      })),
      tags: organization.tagDefinitions.map((tag) => ({
        id: tag.id,
        slug: tag.slug,
        label: tag.label,
        category: tag.category,
      })),
      members: members.map((entry) => ({
        id: entry.id,
        role: entry.role,
        privileges: entry.privileges,
        user: entry.user,
      })),
      availablePlans: plans,
    },
  })
}

export async function POST(request: Request) {
  const auth = await requireApiUser()
  if ("error" in auth) return auth.error

  const orgContext = await getOrgForUser(auth.user.id)
  if (!orgContext) return apiError("No organization membership.", 404)

  let body: { teamId?: string; name?: string }
  try {
    body = await request.json()
  } catch {
    return apiError("Invalid JSON body.")
  }

  const teamId = body.teamId?.trim()
  const name = body.name?.trim()
  if (!teamId || !name) return apiError("teamId and name are required.")

  const team = await db.team.findFirst({
    where: { id: teamId, organizationId: orgContext.organization.id },
  })
  if (!team) return apiError("Team not found.", 404)

  const group = await db.group.create({
    data: {
      teamId,
      organizationId: orgContext.organization.id,
      name,
    },
  })

  return NextResponse.json({ group }, { status: 201 })
}
