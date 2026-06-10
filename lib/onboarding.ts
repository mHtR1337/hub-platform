import { auth, clerkClient } from "@clerk/nextjs/server"
import type { UserRole } from "@/types"

export async function markOnboardingComplete(
  userId: string,
  role: UserRole,
) {
  const client = await clerkClient()
  await client.users.updateUser(userId, {
    publicMetadata: {
      role,
      onboardingComplete: true,
    },
  })
}

export async function syncClerkEmail(clerkId: string): Promise<string | null> {
  const client = await clerkClient()
  const clerkUser = await client.users.getUser(clerkId)
  return (
    clerkUser.emailAddresses.find(
      (entry) => entry.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? null
  )
}
