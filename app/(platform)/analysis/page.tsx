import { AppShell } from "@/components/platform/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AnalysisPage() {
  return (
    <AppShell title="Dashboard / Analysis">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard / Analysis
          </h1>
          <p className="text-sm text-muted-foreground">
            Publish charts, widgets and flags to the board, calendar and athlete cards.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {["Team readiness", "Attendance trend", "Flags by app"].map((t) => (
            <Card key={t}>
              <CardHeader>
                <CardTitle className="text-base">{t}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Placeholder widget — Phase 6.
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
