// TODO (Phase 0): Uncomment after `pnpm add @clerk/nextjs`.
// Re-exports Clerk helpers used across the codebase so import paths stay stable
// if we ever swap auth providers.
//
// export { auth, currentUser } from '@clerk/nextjs/server'
//
// export async function requireRole(role: 'athlete' | 'coach' | 'admin') {
//   const { userId } = await auth()
//   if (!userId) redirect('/login')
//   const user = await db.user.findUnique({ where: { clerkId: userId } })
//   if (!user || user.role !== role) redirect('/dashboard')
//   return user
// }
