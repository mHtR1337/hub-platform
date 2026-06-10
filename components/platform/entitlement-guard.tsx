import { auth } from "@clerk/nextjs/server"
import type * as React from "react"

import { hasEntitlement } from "@/lib/entitlements"
import { Paywall } from "@/components/platform/paywall"

interface EntitlementGuardProps {
  slug: string
  children: React.ReactNode
}

export async function EntitlementGuard({ slug, children }: EntitlementGuardProps) {
  const { userId } = await auth()
  if (!userId) return <Paywall slug={slug} />

  const entitled = await hasEntitlement(userId, slug)
  if (!entitled) return <Paywall slug={slug} />

  return <>{children}</>
}
