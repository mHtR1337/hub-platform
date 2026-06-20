import { NextResponse } from "next/server"

import { apiError, requireApiUser } from "@/lib/api-auth"
import { assignMemberTag, getOrgForUser } from "@/lib/organization"

export async function GET() {
  const auth = await requireApiUser()
  if ("error" in auth) return auth.error

  const orgContext = await getOrgForUser(auth.user.id)
  if (!orgContext) return apiError("No organization membership.", 404)

  return NextResponse.json({
    tags: orgContext.organization.tagDefinitions.map((tag) => ({
      id: tag.id,
      slug: tag.slug,
      label: tag.label,
      category: tag.category,
    })),
  })
}

export async function POST(request: Request) {
  const auth = await requireApiUser()
  if ("error" in auth) return auth.error

  const orgContext = await getOrgForUser(auth.user.id)
  if (!orgContext) return apiError("No organization membership.", 404)

  let body: { userId?: string; tagSlug?: string; value?: string }
  try {
    body = await request.json()
  } catch {
    return apiError("Invalid JSON body.")
  }

  const userId = body.userId?.trim()
  const tagSlug = body.tagSlug?.trim()
  const value = body.value ?? ""
  if (!userId || !tagSlug) return apiError("userId and tagSlug are required.")

  try {
    const tag = await assignMemberTag(
      orgContext.organization.id,
      userId,
      tagSlug,
      value,
    )
    return NextResponse.json({ tag }, { status: 201 })
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to assign tag.",
    )
  }
}
