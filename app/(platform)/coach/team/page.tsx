import { redirect } from "next/navigation"

import { AppShell } from "@/components/platform/app-shell"
import { CoachTeamManager } from "@/components/coach/coach-team-manager"
import { listCoachRoster } from "@/lib/coach"
import { requireCoachOrganization, requireDbUser } from "@/lib/users"

export default async function CoachTeamPage() {
  const user = await requireDbUser()
  if (user.role !== "coach") redirect("/profile")

  const org = await requireCoachOrganization(user.id)
  if (!org) redirect("/onboarding/coach")

  const roster = await listCoachRoster(user.id)

  return (
    <AppShell title="Team">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-pretty text-2xl font-semibold tracking-tight">
            {org.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Create teams, invite athletes, and manage your roster. Each coach
            runs a separate organization on Hub.
          </p>
        </div>

        <CoachTeamManager
          organizationName={org.name}
          teams={org.teams.map((team) => ({
            id: team.id,
            name: team.name,
          }))}
          roster={roster.map((row) => ({
            id: row.id,
            status: row.status,
            inviteEmail: row.inviteEmail,
            inviteToken: row.inviteToken,
            athlete: row.athlete,
            team: row.team,
          }))}
        />
      </div>
    </AppShell>
  )
}
