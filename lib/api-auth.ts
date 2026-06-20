import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { db } from "@/lib/db"

export async function requireApiUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) {
    return {
      error: NextResponse.json(
        { error: "User not onboarded. Complete /onboarding first." },
        { status: 403 },
      ),
    }
  }

  return { user }
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}
