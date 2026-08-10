import { AppShell } from "@/components/platform/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const TABLES = [
  "athletes",
  "calendar_events",
  "attendance_records",
  "flags",
  "status_history",
  "audit_log",
]

export default function SyncPage() {
  return (
    <AppShell title="Sync Tool">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sync Tool</h1>
            <p className="text-sm text-muted-foreground">
              Permission-aware CSV / JSON exports for Power BI, Shiny and external analysis.
            </p>
          </div>
          <Button variant="outline">Run sync</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export tables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {TABLES.map((t) => (
                <div
                  key={t}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <code className="text-xs">{t}</code>
                  <Button size="sm" variant="ghost" disabled>
                    Export
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Access rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Exports respect org / team / role scope.</p>
              <p>Medical fields require explicit permission.</p>
              <p>Export actions are audited.</p>
              <p className="pt-2 text-xs">Phase 7 — implementation after Calendar and Flags land.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
