// TODO (Phase 2): Dynamically import the sub-app module for this slug.
// Pattern: const SubApp = (await import(`@/sub-apps/${slug}/index`)).default
// For now this page is unreachable because EntitlementGuard always shows <Paywall />.

export default async function SubAppPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Sub-app <code className="font-mono">{slug}</code> — coming in Phase 2.
      </p>
    </div>
  )
}
