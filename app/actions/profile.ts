"use server"

import { revalidatePath } from "next/cache"

import { createTeamForCoach, inviteAthleteToTeam, revokeCoachAthlete } from "@/lib/coach"
import { requireDbUser, updateOrganization } from "@/lib/users"

export async function updateOrganizationAction(formData: FormData) {
  const user = await requireDbUser()
  if (user.role !== "coach") {
    throw new Error("Only coaches can update organization settings.")
  }

  const name = String(formData.get("name") ?? "")
  const sport = String(formData.get("sport") ?? "")

  await updateOrganization(user.id, { name, sport })
  revalidatePath("/profile")
  revalidatePath("/coach/team")
}

export async function createTeamAction(formData: FormData) {
  const user = await requireDbUser()
  if (user.role !== "coach") {
    throw new Error("Only coaches can create teams.")
  }

  const name = String(formData.get("name") ?? "")
  await createTeamForCoach(user.id, name)
  revalidatePath("/coach/team")
}

export async function inviteAthleteAction(formData: FormData) {
  const user = await requireDbUser()
  if (user.role !== "coach") {
    throw new Error("Only coaches can invite athletes.")
  }

  const email = String(formData.get("email") ?? "")
  const teamId = String(formData.get("teamId") ?? "") || undefined

  const result = await inviteAthleteToTeam(user.id, { email, teamId })
  revalidatePath("/coach/team")
  return result
}

export async function revokeAthleteAction(formData: FormData) {
  const user = await requireDbUser()
  if (user.role !== "coach") {
    throw new Error("Only coaches can remove athletes.")
  }

  const relationshipId = String(formData.get("relationshipId") ?? "")
  await revokeCoachAthlete(user.id, relationshipId)
  revalidatePath("/coach/team")
}
