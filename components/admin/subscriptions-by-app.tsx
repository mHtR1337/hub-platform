import { subscriptionsByApp } from "@/lib/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SubscriptionsByApp() {
  const total = subscriptionsByApp.reduce((sum, a) => sum + a.subscribers, 0)
  const max = Math.max(...subscriptionsByApp.map((a) => a.subscribers))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Subscriptions by app</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {subscriptionsByApp.map((item) => {
          const share = Math.round((item.subscribers / total) * 100)
          return (
            <div key={item.app} className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.app}</span>
                <span className="tabular-nums text-muted-foreground">
                  {item.subscribers.toLocaleString()} · {share}%
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
                role="img"
                aria-label={`${item.app}: ${item.subscribers} subscribers, ${share} percent`}
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(item.subscribers / max) * 100}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
