import { subscriptions } from "@/lib/account"
import { formatPrice } from "@/lib/apps"
import { appIconMap } from "@/lib/app-icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function SubscriptionsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Active subscriptions</CardTitle>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>App</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Next billing</TableHead>
              <TableHead className="text-right">Manage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map(({ app, status, nextBilling }) => {
              const Icon = appIconMap[app.icon]
              return (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-md border border-primary/20 bg-accent text-accent-foreground">
                        <Icon className="size-4" aria-hidden="true" />
                      </div>
                      <span className="font-medium">{app.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatPrice(app.price)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <StatusBadge status={status} />
                  </TableCell>
                  <TableCell className="hidden tabular-nums text-muted-foreground md:table-cell">
                    {nextBilling}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
