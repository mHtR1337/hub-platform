import { NextResponse } from "next/server"

import { apiError, requireApiUser } from "@/lib/api-auth"
import { inviteAthleteToTeam, SeatLimitError } from "@/lib/coach"
import { getOrgForUser, requireOrgPrivilege } from "@/lib/organization"
import { db } from "@/lib/db"

type RouteContext = { params: Promise<{ teamId: string }> }

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiUser()
  if ("error" in auth) return auth.error

  const privileged = await requireOrgPrivilege(auth.user.id, "manage_roster")
  if (!privileged) return apiError("Forbidden.", 403)

  const { teamId } = await context.params
  const team = await db.team.findFirst({
    where: {
      id: teamId,
      organizationId: privileged.organization.id,
    },
  })
  if (!team) return apiError("Team not found.", 404)

  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return apiError("Invalid JSON body.")
  }

  const email = body.email?.trim()
  if (!email) return apiError("email is required.")

  try {
    const result = await inviteAthleteToTeam(auth.user.id, {
      email,
      teamId,
    })
    return NextResponse.json(
      {
        invite: {
          id: result.row.id,
          status: result.row.status,
          inviteEmail: result.row.inviteEmail,
          inviteUrl: result.inviteUrl,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof SeatLimitError) {
      return apiError(error.message, 402)
    }
    return apiError(
      error instanceof Error ? error.message : "Failed to invite athlete.",
    )
  }
}
