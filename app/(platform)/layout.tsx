import type * as React from "react"
import { auth } from "@clerk/nextjs/server"

import { HardRedirect } from "@/components/platform/hard-redirect"
import { db } from "@/lib/db"

// Every page under (platform) runs this check.
// Middleware already blocks unauthenticated users; we verify the user
// has completed onboarding via a local DB row (avoids slow Clerk API calls).
export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) return <HardRedirect to="/login" />

  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  })

  if (!dbUser) return <HardRedirect to="/onboarding" />

  return <>{children}</>
}
