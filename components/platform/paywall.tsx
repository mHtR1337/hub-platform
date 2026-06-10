"use client"

import * as React from "react"
import { Lock, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export function Paywall({ slug }: { slug: string }) {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleUnlock = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appSlug: slug }),
      })

      const data = (await response.json()) as { url?: string; error?: string }

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Failed to start checkout")
      }

      window.location.href = data.url
    } catch (error) {
      console.error("Checkout failed:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <Lock className="size-6 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">This app is locked</h2>
        <p className="text-sm text-muted-foreground">
          Purchase a subscription to access this app.
        </p>
      </div>
      <Button disabled={isLoading} onClick={() => void handleUnlock()}>
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Redirecting…
          </>
        ) : (
          <>Unlock {slug}</>
        )}
      </Button>
    </div>
  )
}
