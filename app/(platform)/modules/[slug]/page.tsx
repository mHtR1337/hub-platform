import { AppShell } from "@/components/platform/app-shell"
import { SmftClient } from "@/components/modules/smft-client"
import { getOrgContext, listAthletesForOrg } from "@/lib/athletes"
import { listSmftResults } from "@/lib/smft"
import { requireDbUser } from "@/lib/users"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const MODULES: Record<
  string,
  { title: string; description: string; phase: string }
> = {
  session: {
    title: "Session Tool",
    description: "Attendance, activity tags and notes linked to calendar events.",
    phase: "Phase 6",
  },
  survey: {
    title: "Survey Tool",
    description: "Morning wellness, sRPE and recovery questionnaires with flag rules.",
    phase: "Phase 6",
  },
  smft: {
    title: "Testing / SMFT",
    description: "Manual test entry, simple trends, publish SMFT up/down flags to Hub.",
    phase: "Phase 6 (HUB-34)",
  },
  hiit: {
    title: "HIIT Builder",
    description: "PDF-first session generator; attach output to calendar events.",
    phase: "Phase 6",
  },
  asp: {
    title: "Agile Strength Planner",
    description: "Strength prescription PDFs; print-first MVP, no athlete data entry.",
    phase: "Phase 6",
  },
  diary: {
    title: "Training Diary",
    description: "Coach notes linked to athletes and events. AI diary is a paid later module.",
    phase: "Phase 6",
  },
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const mod = MODULES[slug]

  if (slug === "smft") {
    const user = await requireDbUser()
    const ctx = await getOrgContext(user.id)
    const athletes = ctx
      ? await listAthletesForOrg(ctx.organization.id, ctx.organization.teams[0]?.id)
      : []
    const results = ctx ? await listSmftResults(ctx.organization.id) : []

    return (
      <AppShell title="Testing / SMFT">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Testing / SMFT
            </h1>
            <p className="text-sm text-muted-foreground">
              Manual result entry. Choosing Up/Down publishes a Hub flag on the
              athlete card.
            </p>
          </div>
          <SmftClient
            athletes={athletes.map((a) => ({ id: a.id, name: a.name }))}
            results={results}
          />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title={mod?.title ?? "Module"}>
      <Card>
        <CardHeader>
          <CardTitle>{mod?.title ?? "Unknown module"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{mod?.description ?? `No module registered for "${slug}".`}</p>
          {mod && <p className="text-xs">Scaffold — full build in {mod.phase}.</p>}
        </CardContent>
      </Card>
    </AppShell>
  )
}
