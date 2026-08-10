"use server"

import { revalidatePath } from "next/cache"

import {
  createAthlete,
  getOrgContext,
  updateAthleteMedicalStatus,
  updateAthleteTrainingStatus,
} from "@/lib/athletes"
import {
  createCalendarEvent,
  setEventParticipants,
  upsertAttendance,
} from "@/lib/calendar"
import { requireDbUser } from "@/lib/users"

async function requireOrg() {
  const user = await requireDbUser()
  const ctx = await getOrgContext(user.id)
  if (!ctx) throw new Error("Complete coach setup before managing the Hub.")
  return { user, ...ctx }
}

export async function createAthleteAction(formData: FormData) {
  const { user, organization } = await requireOrg()
  const name = String(formData.get("name") ?? "")
  const position = String(formData.get("position") ?? "")
  const trainingStatus = String(formData.get("trainingStatus") ?? "")
  const teamId =
    String(formData.get("teamId") ?? "") || organization.teams[0]?.id || null

  await createAthlete({
    organizationId: organization.id,
    name,
    position,
    activeTeamId: teamId,
    trainingStatus: trainingStatus || undefined,
    actorId: user.id,
  })

  revalidatePath("/board")
  revalidatePath("/calendar")
  revalidatePath("/coach/team")
}

export async function updateTrainingStatusAction(
  athleteId: string,
  trainingStatus: string,
) {
  const { user, organization } = await requireOrg()
  await updateAthleteTrainingStatus({
    athleteId,
    organizationId: organization.id,
    trainingStatus,
    actorId: user.id,
    source: "visual-board",
  })
  revalidatePath("/board")
}

export async function updateMedicalStatusAction(
  athleteId: string,
  medicalStatus: string,
) {
  const { user, organization } = await requireOrg()
  await updateAthleteMedicalStatus({
    athleteId,
    organizationId: organization.id,
    medicalStatus,
    actorId: user.id,
    source: "athlete-drawer",
  })
  revalidatePath("/board")
}

export async function createEventAction(formData: FormData) {
  const { user, organization } = await requireOrg()
  const title = String(formData.get("title") ?? "")
  const type = String(formData.get("type") ?? "training")
  const startsAtRaw = String(formData.get("startsAt") ?? "")
  const location = String(formData.get("location") ?? "")
  const teamId =
    String(formData.get("teamId") ?? "") || organization.teams[0]?.id || null

  if (!startsAtRaw) throw new Error("Start time is required.")

  await createCalendarEvent({
    organizationId: organization.id,
    teamId,
    type,
    title,
    startsAt: new Date(startsAtRaw),
    location,
    createdById: user.id,
  })

  revalidatePath("/calendar")
  revalidatePath("/dashboard")
}

export async function setEventParticipantsAction(
  eventId: string,
  athleteIds: string[],
) {
  const { user, organization } = await requireOrg()
  await setEventParticipants({
    eventId,
    organizationId: organization.id,
    athleteIds,
    actorId: user.id,
  })
  revalidatePath("/calendar")
}

export async function upsertAttendanceAction(
  eventId: string,
  athleteId: string,
  status: string,
) {
  const { user, organization } = await requireOrg()
  await upsertAttendance({
    eventId,
    organizationId: organization.id,
    athleteId,
    status,
    actorId: user.id,
  })
  revalidatePath("/calendar")
}
