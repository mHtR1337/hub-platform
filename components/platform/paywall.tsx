// TODO (Phase 1): Wire "Unlock" button to POST /api/checkout.
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Paywall({ slug }: { slug: string }) {
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
      {/* TODO: POST /api/checkout { slug } */}
      <Button>Unlock {slug}</Button>
    </div>
  )
}
