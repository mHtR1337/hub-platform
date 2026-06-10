// TODO (Phase 3): Build Endurance Calculator UI.
// Features: FTP entry + 7-zone training zones, critical power calculator
// (3/12/20 min tests), zone distribution chart.

export default function EnduranceCalculator({ userId }: { userId: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Endurance Calculator</h2>
      <p className="text-sm text-muted-foreground">
        Coming in Phase 3. userId: {userId}
      </p>
    </div>
  )
}
