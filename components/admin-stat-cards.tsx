import { DollarSign, CreditCard, Users, Star, TrendingUp, type LucideIcon } from "lucide-react"

import { adminStats } from "@/lib/admin"
import { Card, CardContent } from "@/components/ui/card"

interface Stat {
  label: string
  value: string
  delta?: number
  caption?: string
  icon: LucideIcon
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n)
}

export function AdminStatCards() {
  const stats: Stat[] = [
    {
      label: "MRR",
      value: `$${formatNumber(adminStats.mrr)}`,
      delta: adminStats.mrrDelta,
      icon: DollarSign,
    },
    {
      label: "Active subscriptions",
      value: formatNumber(adminStats.activeSubscriptions),
      delta: adminStats.activeSubsDelta,
      icon: CreditCard,
    },
    {
      label: "Total users",
      value: formatNumber(adminStats.totalUsers),
      delta: adminStats.totalUsersDelta,
      icon: Users,
    },
    {
      label: "Most popular app",
      value: adminStats.mostPopularApp,
      caption: `${adminStats.mostPopularShare}% of subscribers`,
      icon: Star,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <stat.icon className="size-4" aria-hidden="true" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-semibold tracking-tight tabular-nums">
                {stat.value}
              </span>
              {stat.delta !== undefined ? (
                <span className="flex items-center gap-1 text-xs font-medium text-primary">
                  <TrendingUp className="size-3.5" aria-hidden="true" />
                  {stat.delta}%
                  <span className="font-normal text-muted-foreground">
                    vs last month
                  </span>
                </span>
              ) : null}
              {stat.caption ? (
                <span className="text-xs text-muted-foreground">{stat.caption}</span>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
