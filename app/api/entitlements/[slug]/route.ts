import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

import { db } from "@/lib/db"
import { hasEntitlement } from "@/lib/entitlements"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { slug } = await params
  const active = await hasEntitlement(userId, slug)

  const entitlement = await db.entitlement.findFirst({
    where: {
      user: { clerkId: userId },
      appSlug: slug,
    },
    select: { status: true },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({
    active,
    status: entitlement?.status ?? null,
  })
}
