import { CreditCard, CalendarClock, Layers } from "lucide-react"

import { account } from "@/lib/account"
import { formatPrice, monthlyTotal } from "@/lib/apps"

export function AccountSummaryStrip() {
  const total = monthlyTotal()

  const items = [
    {
      icon: Layers,
      label: "Plan",
      value: account.plan,
    },
    {
      icon: CreditCard,
      label: "Monthly total",
      value: formatPrice(total),
    },
    {
      icon: CalendarClock,
      label: "Next billing",
      value: account.nextBilling,
    },
  ]

  return (
    <div className="grid grid-cols-1 divide-y divide-border rounded-lg border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3 px-4 py-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <item.icon className="size-4.5" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="text-sm font-medium tabular-nums">{item.value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
