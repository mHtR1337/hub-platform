// Entry component for your sub-app.
// The platform injects `userId` — the authenticated user's internal DB id.
// All data fetching for this sub-app is your responsibility.
// Do NOT implement auth or billing here — the platform handles both.

export default function TemplateApp({ userId }: { userId: string }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Replace this with your sub-app UI. userId: {userId}
      </p>
    </div>
  )
}
