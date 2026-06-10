import { CreditCard, ExternalLink } from "lucide-react"

import { account, accountMonthlyTotal } from "@/lib/account"
import { formatPrice } from "@/lib/apps"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function BillingCard() {
  const total = accountMonthlyTotal()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Billing</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Monthly total</span>
          <span className="text-sm font-semibold tabular-nums">
            {formatPrice(total)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Next billing date</span>
          <span className="text-sm font-medium tabular-nums">
            {account.nextBilling}
          </span>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">Payment method</span>
          <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
            <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <CreditCard className="size-4.5" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {account.paymentBrand} ending {account.paymentLast4}
              </span>
              <span className="text-xs text-muted-foreground">
                Default payment method
              </span>
            </div>
          </div>
        </div>

        {/* TODO (Phase 1): POST /api/portal to get Stripe Customer Portal URL */}
        <Button className="w-full">
          Manage billing
          <ExternalLink className="size-4" />
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Opens the secure billing portal.
        </p>
      </CardContent>
    </Card>
  )
}
