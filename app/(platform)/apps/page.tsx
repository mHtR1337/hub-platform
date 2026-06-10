import { auth } from "@clerk/nextjs/server"

import { AppShell } from "@/components/platform/app-shell"
import { BundleBanner } from "@/components/catalog/bundle-banner"
import { AppCatalog } from "@/components/catalog/app-catalog"
import { catalogMetaForSlug, type HubApp } from "@/lib/apps"
import { db } from "@/lib/db"
import { getUserEntitlements } from "@/lib/entitlements"

export default async function AppsPage() {
  const { userId } = await auth()

  const [dbApps, entitledSlugs] = await Promise.all([
    db.app.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    userId ? getUserEntitlements(userId) : Promise.resolve([]),
  ])

  const entitledSet = new Set(entitledSlugs)

  const apps: HubApp[] = dbApps.map((app) => {
    const meta = catalogMetaForSlug(app.slug)
    return {
      id: app.slug,
      name: app.name,
      description: app.description,
      icon: meta.icon,
      category: meta.category,
      price: app.priceMonthlyCents / 100,
      state: entitledSet.has(app.slug) ? "unlocked" : "locked",
    }
  })

  return (
    <AppShell title="My apps" searchPlaceholder="Search the catalog...">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-pretty text-2xl font-semibold tracking-tight">
            App catalog
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse every app on the platform and unlock the ones you need.
          </p>
        </div>

        <BundleBanner />
        <AppCatalog apps={apps} />
      </div>
    </AppShell>
  )
}
