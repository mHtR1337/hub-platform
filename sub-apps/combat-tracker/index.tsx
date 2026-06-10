// TODO (Phase 3): Build Combat Tracker UI.
// Features: log training sessions (type, duration, RPE), ACWR calculation,
// weekly/monthly load chart, overtraining risk indicator.

export default function CombatTracker({ userId }: { userId: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Combat Tracker</h2>
      <p className="text-sm text-muted-foreground">
        Coming in Phase 3. userId: {userId}
      </p>
    </div>
  )
}
