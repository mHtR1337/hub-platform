import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"

import { AppShell } from "@/components/platform/app-shell"
import { AccountInfoCard } from "@/components/account/account-info-card"
import { OrganizationSettingsCard } from "@/components/account/organization-settings-card"
import { RoleSettingsCard } from "@/components/account/role-settings-card"
import { SubscriptionsTable } from "@/components/billing/subscriptions-table"
import { BillingCard } from "@/components/billing/billing-card"
import { requireDbUser } from "@/lib/users"
import type { UserRole } from "@/types"

function initialsFor(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

export default async function ProfilePage() {
  const clerkUser = await currentUser()
  const dbUser = await requireDbUser()

  const role = (clerkUser?.publicMetadata?.role as UserRole | undefined) ?? dbUser.role
  const email = dbUser.email
  const name =
    clerkUser?.fullName ??
    clerkUser?.primaryEmailAddress?.emailAddress ??
    email

  const organization = dbUser.organization

  if (role === "coach" && !organization) {
    redirect("/onboarding/coach")
  }

  return (
    <AppShell title="Profile">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-pretty text-2xl font-semibold tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account mode, organization, and billing.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <AccountInfoCard
              name={name}
              email={email}
              initials={initialsFor(name, email)}
              role={role}
            />
            <RoleSettingsCard
              currentRole={role}
              hasOrganization={Boolean(organization)}
            />
            {role === "coach" && organization && (
              <OrganizationSettingsCard
                name={organization.name}
                sport={organization.sport}
              />
            )}
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
