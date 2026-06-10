"use client"

import { useEffect } from "react"

type HardRedirectProps = {
  to: string
}

export function HardRedirect({ to }: HardRedirectProps) {
  useEffect(() => {
    window.location.replace(to)
  }, [to])

  return (
    <div className="flex min-h-svh items-center justify-center bg-background text-sm text-muted-foreground">
      Redirecting…
    </div>
  )
}
