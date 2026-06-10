import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { acceptCoachInvite } from "@/lib/coach"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  let body: { token?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const token = body.token?.trim()
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Sign in to accept this invite" }, { status: 401 })
  }

  const athlete = await db.user.findUnique({ where: { clerkId: userId } })
  if (!athlete) {
    return NextResponse.json({ error: "Complete onboarding first" }, { status: 403 })
  }

  try {
    const relationship = await acceptCoachInvite(token, athlete.id)
    return NextResponse.json({ relationship })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to accept invite"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
