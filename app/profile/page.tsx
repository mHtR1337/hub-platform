import { AppShell } from "@/components/app-shell"
import { AccountInfoCard } from "@/components/account-info-card"
import { SubscriptionsTable } from "@/components/subscriptions-table"
import { BillingCard } from "@/components/billing-card"

export default function ProfilePage() {
  return (
    <AppShell title="Profile">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-pretty text-2xl font-semibold tracking-tight">
            Account &amp; billing
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account details and subscriptions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <AccountInfoCard />
            <SubscriptionsTable />
          </div>
          <div className="lg:col-span-1">
            <BillingCard />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
