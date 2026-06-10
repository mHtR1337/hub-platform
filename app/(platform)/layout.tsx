// TODO (Phase 0): Wrap with Clerk <SignedIn> / redirect to /login if unauthenticated.
import type * as React from "react"

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
