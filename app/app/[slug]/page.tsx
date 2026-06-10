import { auth } from "@clerk/nextjs/server"
import type { ComponentType } from "react"

const subAppLoaders: Record<
  string,
  () => Promise<{ default: ComponentType<{ userId: string }> }>
> = {
  "hrv-monitor": () => import("@/sub-apps/hrv-monitor/index"),
  "combat-tracker": () => import("@/sub-apps/combat-tracker/index"),
  "endurance-calculator": () => import("@/sub-apps/endurance-calculator/index"),
}

export default async function SubAppPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const loader = subAppLoaders[slug]
  if (!loader) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <h1 className="text-2xl font-semibold tracking-tight">App not found</h1>
        <p className="text-sm text-muted-foreground">
          No sub-app is registered for <code className="font-mono">{slug}</code>.
        </p>
      </div>
    )
  }

  const SubApp = (await loader()).default
  return <SubApp userId={userId} />
}
