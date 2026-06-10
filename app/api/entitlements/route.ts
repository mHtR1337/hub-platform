import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

import { getUserEntitlements } from "@/lib/entitlements"

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const slugs = await getUserEntitlements(userId)
  return NextResponse.json({ slugs })
}
