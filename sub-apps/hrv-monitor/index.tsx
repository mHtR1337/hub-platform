// TODO (Phase 2): Build HRV Monitor UI.
// Features: log daily reading, 7-day trend chart, readiness score (0–100),
// baseline calculation (28-day rolling average), color-coded recommendation.

export default function HrvMonitor({ userId }: { userId: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">HRV Monitor</h2>
      <p className="text-sm text-muted-foreground">
        Coming in Phase 2. userId: {userId}
      </p>
    </div>
  )
}
