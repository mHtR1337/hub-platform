import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { apps, BUNDLE_PRICE, formatPrice } from "@/lib/apps"

export function BundleBanner() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-primary/20 bg-accent p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold tracking-tight text-accent-foreground">
            Unlock all apps
          </h2>
          <p className="text-sm text-accent-foreground/80">
            Get all {apps.length} apps and everything we ship next for one price.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:shrink-0">
        <span className="text-sm font-semibold tabular-nums text-accent-foreground">
          {formatPrice(BUNDLE_PRICE)}
        </span>
        <Button>Unlock bundle</Button>
      </div>
    </div>
  )
}
