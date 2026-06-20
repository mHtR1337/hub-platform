import { NextResponse } from "next/server"

import { apiError, requireApiUser } from "@/lib/api-auth"
import { getOrgForUser } from "@/lib/organization"

export async function GET() {
  const auth = await requireApiUser()
  if ("error" in auth) return auth.error

  const { user } = auth
  const orgContext = await getOrgForUser(user.id)

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      clerkId: user.clerkId,
    },
    organization: orgContext
      ? {
          id: orgContext.organization.id,
          name: orgContext.organization.name,
          sport: orgContext.organization.sport,
          memberRole: orgContext.membership.role,
          privileges: orgContext.membership.privileges,
        }
      : null,
  })
}
