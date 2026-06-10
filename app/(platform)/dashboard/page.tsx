import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { auth } from "@clerk/nextjs/server"

import { AppShell } from "@/components/platform/app-shell"
import { AppCard } from "@/components/catalog/app-card"
import { AccountSummaryStrip } from "@/components/account/account-summary-strip"
import { SectionHeader } from "@/components/shared/section-header"
import { Button } from "@/components/ui/button"
import { catalogMetaForSlug, type HubApp } from "@/lib/apps"
import { db } from "@/lib/db"
import { getUserEntitlements } from "@/lib/entitlements"

export default async function DashboardPage() {
  const { userId } = await auth()

  const [dbApps, entitledSlugs] = await Promise.all([
    db.app.findMany({
      where: { active: true, slug: { not: "bundle" } },
      orderBy: { sortOrder: "asc" },
    }),
    userId ? getUserEntitlements(userId) : Promise.resolve([]),
  ])

  const entitledSet = new Set(entitledSlugs)
  const dbUser = userId
    ? await db.user.findUnique({
        where: { clerkId: userId },
        select: { email: true },
      })
    : null

  const firstName = dbUser?.email?.split("@")[0] ?? "there"

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

  const unlocked = apps.filter((app) => app.state === "unlocked")
  const locked = apps.filter((app) => app.state === "locked")

  return (
    <AppShell title="Dashboard">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-pretty text-2xl font-semibold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Launch your active apps or discover new tools for your athletes.
          </p>
        </div>

        <AccountSummaryStrip />

        <section>
          <SectionHeader
            title="Your apps"
            description="Apps you've unlocked and can open right away."
            action={
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/apps" />}
              >
                View all
                <ArrowRight className="size-4" />
              </Button>
            }
          />
          {unlocked.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {unlocked.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
              You haven&apos;t unlocked any apps yet. Browse the catalog to get started.
            </div>
          )}
        </section>

        {locked.length > 0 && (
          <section>
            <SectionHeader
              title="Discover"
              description="Unlock more apps to expand your toolkit."
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {locked.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  )
}
