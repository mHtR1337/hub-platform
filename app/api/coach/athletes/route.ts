import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { inviteAthleteToTeam, listCoachRoster } from "@/lib/coach"
import { db } from "@/lib/db"
import { getCurrentRole } from "@/lib/clerk"

export async function GET() {
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

  const athletes = await listCoachRoster(coach.id)
  return NextResponse.json({ athletes })
}

export async function POST(request: Request) {
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

  let body: { email?: string; teamId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const email = body.email?.trim()
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  try {
    const result = await inviteAthleteToTeam(coach.id, {
      email,
      teamId: body.teamId,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to invite athlete"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
