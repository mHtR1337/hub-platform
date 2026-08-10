import { db } from "@/lib/db"

export async function listEventsForTeam(input: {
  organizationId: string
  teamId?: string | null
  from: Date
  to: Date
}) {
  return db.calendarEvent.findMany({
    where: {
      organizationId: input.organizationId,
      ...(input.teamId ? { teamId: input.teamId } : {}),
      startsAt: { gte: input.from, lt: input.to },
    },
    include: {
      participants: { include: { athlete: true } },
      flags: {
        where: { status: "active" },
        include: { definition: true },
        take: 5,
      },
      linkedRecords: true,
      _count: { select: { attendance: true } },
    },
    orderBy: { startsAt: "asc" },
  })
}

export async function createCalendarEvent(input: {
  organizationId: string
  teamId?: string | null
  type: string
  title: string
  startsAt: Date
  endsAt?: Date | null
  location?: string
  notes?: string
  descriptors?: string[]
  athleteIds?: string[]
  createdById?: string
}) {
  const title = input.title.trim()
  if (!title) throw new Error("Event title is required.")

  const event = await db.calendarEvent.create({
    data: {
      organizationId: input.organizationId,
      teamId: input.teamId ?? null,
      type: input.type || "training",
      title,
      startsAt: input.startsAt,
      endsAt: input.endsAt ?? null,
      location: input.location?.trim() ?? "",
      notes: input.notes?.trim() ?? "",
      descriptors: input.descriptors ?? [],
      createdById: input.createdById ?? null,
      participants: input.athleteIds?.length
        ? {
            create: input.athleteIds.map((athleteId) => ({ athleteId })),
          }
        : undefined,
    },
    include: { participants: true },
  })

  await db.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorId: input.createdById ?? null,
      sourceApp: "hub",
      action: "calendar_event.create",
      resourceType: "calendar_event",
      resourceId: event.id,
      newValue: {
        title: event.title,
        type: event.type,
        startsAt: event.startsAt.toISOString(),
      },
    },
  })

  return event
}
