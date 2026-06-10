// TODO (Phase 1): Gate this route server-side: require user.role === 'admin'.
import { AppShell } from "@/components/platform/app-shell"
import { AdminStatCards } from "@/components/admin/admin-stat-cards"
import { UsersTable } from "@/components/admin/users-table"
import { SubscriptionsByApp } from "@/components/admin/subscriptions-by-app"

export default function AdminPage() {
  return (
    <AppShell title="Admin" searchPlaceholder="Search users...">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-pretty text-2xl font-semibold tracking-tight">
            Platform admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor revenue, users, and subscription health across the platform.
          </p>
        </div>

        <AdminStatCards />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <UsersTable />
          </div>
          <div className="lg:col-span-1">
            <SubscriptionsByApp />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
