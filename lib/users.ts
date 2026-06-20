import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { db } from "@/lib/db"
import type { User } from "@/lib/generated/prisma/client"
import { bootstrapOrganizationForCoach } from "@/lib/organization"
import { markOnboardingComplete, syncClerkEmail } from "@/lib/onboarding"
import type { UserRole } from "@/types"

type UserDb = Pick<typeof db, "user">

/** Link Clerk user to a DB row; re-link by email if the address already exists. */
export async function ensureDbUser(
  clerkId: string,
  email: string,
  role: UserRole = "athlete",
  client: UserDb = db,
): Promise<User> {
  const byClerk = await client.user.findUnique({ where: { clerkId } })
  if (byClerk) {
    if (byClerk.role !== role) {
      return client.user.update({
        where: { clerkId },
        data: { role },
      })
    }
    return byClerk
  }

  const byEmail = await client.user.findUnique({ where: { email } })
  if (byEmail) {
    return client.user.update({
      where: { email },
      data: { clerkId, role },
    })
  }

  return client.user.create({
    data: { clerkId, email, role },
  })
}

export async function getCurrentDbUser() {
  const { userId } = await auth()
  if (!userId) return null

  return db.user.findUnique({
    where: { clerkId: userId },
    include: {
      organization: {
        include: { teams: { orderBy: { createdAt: "asc" } } },
      },
      orgMemberships: {
        include: {
          organization: {
            include: {
              plan: { include: { plan: true } },
              teams: { orderBy: { createdAt: "asc" } },
            },
          },
        },
      },
    },
  })
}

export async function requireDbUser() {
  const user = await getCurrentDbUser()
  if (!user) redirect("/onboarding")
  return user
}

export { syncClerkEmail } from "@/lib/onboarding"

async function setClerkRole(userId: string, role: UserRole) {
  await markOnboardingComplete(userId, role)
}

export async function switchToAthlete() {
  const { userId } = await auth()
  if (!userId) redirect("/login")

  const email = await syncClerkEmail(userId)
  if (!email) redirect("/login")

  await setClerkRole(userId, "athlete")
  await ensureDbUser(userId, email, "athlete")
}

export async function becomeCoachWithOrganization(input: {
  orgName: string
  sport: string
  teamName: string
}) {
  const { userId } = await auth()
  if (!userId) redirect("/login")

  const email = await syncClerkEmail(userId)
  if (!email) redirect("/login")

  const existing = await db.user.findUnique({
    where: { clerkId: userId },
    include: { organization: true },
  })

  if (existing?.role === "coach" && existing.organization) {
    redirect("/coach/team")
  }

  await db.$transaction(async (tx) => {
    const user = await ensureDbUser(userId, email, "coach", tx)

    const orgExists = await tx.organization.findUnique({
      where: { coachId: user.id },
    })

    if (!orgExists) {
      await bootstrapOrganizationForCoach(user.id, input, tx)
    }
  })

  await setClerkRole(userId, "coach")
}

export async function requireCoachOrganization(coachUserId: string) {
  const org = await db.organization.findUnique({
    where: { coachId: coachUserId },
    include: { teams: { orderBy: { createdAt: "asc" } } },
  })
  if (!org) return null
  return org
}

export async function updateOrganization(
  coachUserId: string,
  data: { name: string; sport: string },
) {
  const org = await requireCoachOrganization(coachUserId)
  if (!org) {
    throw new Error("Complete coach setup before updating your organization.")
  }

  return db.organization.update({
    where: { coachId: coachUserId },
    data: {
      name: data.name.trim(),
      sport: data.sport.trim(),
    },
  })
}

/** @deprecated Auto-created orgs removed — use coach onboarding instead. */
export async function ensureCoachOrganization(coachUserId: string) {
  const org = await requireCoachOrganization(coachUserId)
  if (!org) {
    redirect("/onboarding/coach")
  }
  return org
}
