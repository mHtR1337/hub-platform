// TODO (Phase 1): Replace stub EntitlementGuard with real DB check.
// See components/platform/entitlement-guard.tsx and docs/ARCHITECTURE.md.
import type * as React from "react"
import { AppShell } from "@/components/platform/app-shell"
import { EntitlementGuard } from "@/components/platform/entitlement-guard"

export default async function SubAppLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <AppShell title={slug}>
      <EntitlementGuard slug={slug}>{children}</EntitlementGuard>
    </AppShell>
  )
}
