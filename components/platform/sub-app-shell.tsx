// TODO (Phase 2): Add sub-app-level navigation, breadcrumb, and header.
import type * as React from "react"

export function SubAppShell({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-6">{children}</div>
}
