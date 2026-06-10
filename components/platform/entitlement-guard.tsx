// TODO (Phase 1): Replace with real DB check via Prisma.
// This guard is the security core of the platform — it must never trust
// any client-supplied value. See docs/ARCHITECTURE.md § Entitlements System.

import type * as React from "react"
import { Paywall } from "@/components/platform/paywall"

interface EntitlementGuardProps {
  slug: string
  children: React.ReactNode
}

export async function EntitlementGuard({ slug, children }: EntitlementGuardProps) {
  // TODO: replace mock with:
  //   const { userId } = await auth()
  //   const entitlement = await db.entitlement.findFirst({ where: { ... } })
  //   if (!entitlement) return <Paywall slug={slug} />
  const hasEntitlement = false // stub — always shows paywall until Phase 1

  if (!hasEntitlement) return <Paywall slug={slug} />
  return <>{children}</>
}
