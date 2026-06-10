import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { AppShell } from "@/components/platform/app-shell"
import { AppCard } from "@/components/catalog/app-card"
import { AccountSummaryStrip } from "@/components/account/account-summary-strip"
import { SectionHeader } from "@/components/shared/section-header"
import { Button } from "@/components/ui/button"
import { account } from "@/lib/account"
import { lockedApps, unlockedApps } from "@/lib/apps"

export default function DashboardPage() {
  const unlocked = unlockedApps()
  const locked = lockedApps()
  const firstName = account.name.split(" ")[0]

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
              <Button variant="ghost" size="sm" asChild>
                <Link href="/apps">
                  View all
                  <ArrowRight className="size-4" />
                </Link>
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
      </div>
    </AppShell>
  )
}
