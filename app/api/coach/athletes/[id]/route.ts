import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { revokeCoachAthlete } from "@/lib/coach"
import { getCurrentRole } from "@/lib/clerk"
import { db } from "@/lib/db"

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, context: RouteContext) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = await getCurrentRole()
  if (role !== "coach") {
    return NextResponse.json({ error: "Coach access required" }, { status: 403 })
  }

  const coach = await db.user.findUnique({ where: { clerkId: userId } })
  if (!coach) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const { id } = await context.params

  try {
    await revokeCoachAthlete(coach.id, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to remove athlete"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
