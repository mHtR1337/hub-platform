import { redirect } from 'next/navigation'
import { auth, currentUser } from '@clerk/nextjs/server'
import type * as React from 'react'

// Every page under (platform) runs this check.
// Middleware already blocks unauthenticated users, but we double-check here
// to handle edge cases (e.g. stale session) and enforce role completion.
export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const user = await currentUser()
  const role = user?.publicMetadata?.role as string | undefined
  if (!role) redirect('/onboarding')

  return <>{children}</>
}
