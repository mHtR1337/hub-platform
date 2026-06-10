import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { db } from "@/lib/db"
import { markOnboardingComplete, syncClerkEmail } from "@/lib/onboarding"
import type { UserRole } from "@/types"

export async function getCurrentDbUser() {
  const { userId } = await auth()
  if (!userId) return null

  return db.user.findUnique({
    where: { clerkId: userId },
    include: {
      organization: {
        include: { teams: { orderBy: { createdAt: "asc" } } },
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

  await db.user.upsert({
    where: { clerkId: userId },
    create: { clerkId: userId, email, role: "athlete" },
    update: { role: "athlete" },
  })
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
    const user = await tx.user.upsert({
      where: { clerkId: userId },
      create: { clerkId: userId, email, role: "coach" },
      update: { role: "coach" },
    })

    const orgExists = await tx.organization.findUnique({
      where: { coachId: user.id },
    })

    if (!orgExists) {
      const org = await tx.organization.create({
        data: {
          coachId: user.id,
          name: input.orgName,
          sport: input.sport,
        },
      })

      await tx.team.create({
        data: {
          organizationId: org.id,
          name: input.teamName,
        },
      })
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
