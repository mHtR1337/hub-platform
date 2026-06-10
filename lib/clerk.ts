// Re-exports Clerk helpers so import paths stay stable if we ever swap providers.
// Server-only — never import this in Client Components.
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/types'

export { auth, currentUser, clerkClient }

/** Returns the current user's DB-facing role from Clerk publicMetadata. */
export async function getCurrentRole(): Promise<UserRole | null> {
  const user = await currentUser()
  return (user?.publicMetadata?.role as UserRole) ?? null
}

/**
 * Asserts the current session has a specific role.
 * Redirects to /dashboard if the role doesn't match.
 * Use in admin layouts and coach-only routes.
 */
export async function requireRole(role: UserRole): Promise<void> {
  const { userId } = await auth()
  if (!userId) redirect('/login')
  const currentRole = await getCurrentRole()
  if (currentRole !== role) redirect('/dashboard')
}
