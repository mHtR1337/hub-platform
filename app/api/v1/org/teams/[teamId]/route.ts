import { NextResponse } from "next/server"

import { apiError, requireApiUser } from "@/lib/api-auth"
import { getOrgForUser, listTeamRoster } from "@/lib/organization"
import { db } from "@/lib/db"

type RouteContext = { params: Promise<{ teamId: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiUser()
  if ("error" in auth) return auth.error

  const { teamId } = await context.params
  const orgContext = await getOrgForUser(auth.user.id)
  if (!orgContext) return apiError("No organization membership.", 404)

  const team = await db.team.findFirst({
    where: { id: teamId, organizationId: orgContext.organization.id },
    include: {
      groups: {
        include: {
          members: {
            include: { user: { select: { id: true, email: true } } },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  })
  if (!team) return apiError("Team not found.", 404)

  const roster = await listTeamRoster(teamId)

  return NextResponse.json({
    team: {
      id: team.id,
      name: team.name,
      roster: roster.map((entry) => ({
        id: entry.id,
        role: entry.role,
        user: entry.user,
      })),
      groups: team.groups.map((group) => ({
        id: group.id,
        name: group.name,
        members: group.members.map((member) => ({
          userId: member.userId,
          email: member.user.email,
        })),
      })),
    },
  })
}
