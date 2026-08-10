import { AppShell } from "@/components/platform/app-shell"
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
