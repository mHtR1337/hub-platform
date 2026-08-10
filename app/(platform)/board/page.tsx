import { AppShell } from "@/components/platform/app-shell"
import { BoardClient } from "@/components/board/board-client"
import type { BoardAthlete } from "@/components/board/visual-board"
import { getOrgContext, listAthletesForOrg } from "@/lib/athletes"
import { requireDbUser } from "@/lib/users"

const DEMO_ATHLETES: BoardAthlete[] = [
  {
    id: "demo-1",
    name: "Jack Miller",
    position: "Flanker",
    medicalStatus: "available-symptomatic",
    trainingStatus: "modified-full-training",
    groups: ["SEN", "Forwards"],
    flags: ["ASP load high", "Wellness low"],
    notes: ["Hamstring tightness — modify high-speed exposure."],
  },
  {
    id: "demo-2",
    name: "Noah Bennett",
    position: "Lock",
    medicalStatus: "modified-symptomatic",
    trainingStatus: "special-program",
    groups: ["SEN", "RTP"],
    flags: ["Questionnaire overdue"],
    notes: ["RTP Phase 1. Needs physio clearance."],
  },
  {
    id: "demo-3",
    name: "Oscar Brown",
    position: "Fullback",
    medicalStatus: "available-asymptomatic",
    trainingStatus: "full-training-competition",
    groups: ["SEN", "Backs"],
    flags: ["HIIT ready"],
    notes: ["Completed submax test. Ready for controlled HIIT."],
  },
  {
    id: "demo-4",
    name: "Alex Reid",
    position: "Flyhalf",
    medicalStatus: "available-no-issues",
    trainingStatus: "full-training-competition",
    groups: ["SEN", "Starters"],
    flags: [],
    notes: ["Starter. Manage extras."],
  },
  {
    id: "demo-5",
    name: "Liam O’Connor",
    position: "Back Row",
    medicalStatus: "available-no-issues",
    trainingStatus: "away-holiday",
    groups: ["SEN", "Travel"],
    flags: ["Diary note"],
    notes: ["Away for family event."],
  },
  {
    id: "demo-6",
    name: "Callum Hayes",
    position: "Hooker",
    medicalStatus: "available-no-issues",
    trainingStatus: "full-training-reserve",
    groups: ["RES", "Forwards"],
    flags: ["HIIT ready"],
    notes: [],
  },
]

export default async function BoardPage() {
  const user = await requireDbUser()
  const ctx = await getOrgContext(user.id)

  let athletes: BoardAthlete[] = DEMO_ATHLETES
  let teamName = "Demo Squad"
  let teamId: string | null = null
  let usingDemo = true

  if (ctx) {
    const team = ctx.organization.teams[0] ?? null
    teamName = team?.name ?? ctx.organization.name
    teamId = team?.id ?? null

    const rows = await listAthletesForOrg(ctx.organization.id, teamId ?? undefined)
    if (rows.length > 0) {
      usingDemo = false
      athletes = rows.map((a) => ({
        id: a.id,
        name: a.name,
        position: a.position,
        medicalStatus: a.medicalStatus,
        trainingStatus: a.trainingStatus,
        groups: a.groups.map((g) => g.group.name),
        flags: a.flags.map((f) => f.definition.label),
        notes: a.notes.map((n) => n.body),
      }))
    } else {
      // Empty org — show empty board with add form (not demo drag-only).
      usingDemo = false
      athletes = []
    }
  }

  return (
    <AppShell title="Visual Board" searchPlaceholder="Search athletes…" wide>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visual Board</h1>
          <p className="text-sm text-muted-foreground">
            Current team state by training status. Drag cards or use Move — changes are
            audited.
            {!ctx
              ? " Complete coach onboarding to manage a real roster."
              : athletes.length === 0
                ? " Add your first athlete below."
                : null}
          </p>
        </div>
        <BoardClient
          athletes={athletes}
          teamName={teamName}
          teamId={teamId}
          usingDemo={usingDemo}
        />
      </div>
    </AppShell>
  )
}
