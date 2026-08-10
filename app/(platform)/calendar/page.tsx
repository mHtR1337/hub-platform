import { AppShell } from "@/components/platform/app-shell"
import {
  CalendarClient,
  type CalendarEventCard,
} from "@/components/calendar/calendar-client"
import type { EventAthleteOption } from "@/components/calendar/event-drawer"
import { getOrgContext, listAthletesForOrg } from "@/lib/athletes"
import { listEventsForTeam } from "@/lib/calendar"
import { requireDbUser } from "@/lib/users"

function startOfWeek(d: Date) {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - day)
  return x
}

function formatDayLabel(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })
}

function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}

export default async function CalendarPage() {
  const user = await requireDbUser()
  const ctx = await getOrgContext(user.id)

  const weekStart = startOfWeek(new Date())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return formatDayLabel(d)
  })

  const weekLabel = `${weekStart.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} – ${new Date(weekEnd.getTime() - 1).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`

  let events: CalendarEventCard[] = []
  let athletes: EventAthleteOption[] = []
  let teamId: string | null = null

  if (ctx) {
    teamId = ctx.organization.teams[0]?.id ?? null
    const [rows, athleteRows] = await Promise.all([
      listEventsForTeam({
        organizationId: ctx.organization.id,
        teamId,
        from: weekStart,
        to: weekEnd,
      }),
      listAthletesForOrg(ctx.organization.id, teamId ?? undefined),
    ])

    athletes = athleteRows.map((a) => ({
      id: a.id,
      name: a.name,
      position: a.position,
    }))

    events = rows.map((e) => {
      const dayIndex = Math.min(
        6,
        Math.max(
          0,
          Math.floor((e.startsAt.getTime() - weekStart.getTime()) / 86400000),
        ),
      )
      const attendance: Record<string, string> = {}
      for (const row of e.attendance) {
        attendance[row.athleteId] = row.status
      }
      return {
        id: e.id,
        dayIndex,
        title: e.title,
        type: e.type,
        timeLabel: formatTime(e.startsAt),
        location: e.location,
        participantIds: e.participants.map((p) => p.athleteId),
        participantCount: e.participants.length,
        attendance,
      }
    })
  }

  return (
    <AppShell title="Team Calendar" wide>
      <CalendarClient
        weekLabel={weekLabel}
        dayLabels={dayLabels}
        events={events}
        athletes={athletes}
        teamId={teamId}
        canCreate={!!ctx}
      />
    </AppShell>
  )
}
