"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  becomeCoachWithOrganization,
  requireDbUser,
  switchToAthlete,
} from "@/lib/users"

export async function becomeCoachAction(formData: FormData) {
  const orgName = String(formData.get("orgName") ?? "").trim()
  const sport = String(formData.get("sport") ?? "").trim()
  const teamName = String(formData.get("teamName") ?? "").trim()

  if (!orgName || !sport || !teamName) {
    throw new Error("Organization name, sport, and team name are required.")
  }

  await becomeCoachWithOrganization({ orgName, sport, teamName })
  revalidatePath("/", "layout")
  redirect("/coach/team")
}

export async function switchToAthleteAction() {
  await switchToAthlete()
  revalidatePath("/", "layout")
  redirect("/dashboard")
}
