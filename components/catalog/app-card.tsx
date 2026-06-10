"use client"

import * as React from "react"
import { Lock } from "lucide-react"

import { formatPrice, type HubApp } from "@/lib/apps"
import { appIconMap } from "@/lib/app-icons"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function AppCard({ app }: { app: HubApp }) {
  const Icon = appIconMap[app.icon]
  const isLocked = app.state === "locked"

  const handleActivate = React.useCallback(() => {
    // TODO (Phase 1): POST /api/checkout { slug: app.id } for locked apps,
    // or navigate to /app/[slug] for unlocked apps.
  }, [])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleActivate()
    }
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={
        isLocked
          ? `${app.name}, locked, ${formatPrice(app.price)}. Press to unlock.`
          : `${app.name}, active. Press to open.`
      }
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative flex flex-col gap-4 p-5 transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "hover:border-foreground/20",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "relative flex size-11 items-center justify-center rounded-lg border",
            isLocked
              ? "border-border bg-muted text-muted-foreground"
              : "border-primary/20 bg-accent text-accent-foreground",
          )}
        >
          <Icon className="size-5.5" aria-hidden="true" />
          {isLocked && (
            <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
              <Lock className="size-3" aria-hidden="true" />
            </span>
          )}
        </div>

        {isLocked ? (
          <span className="text-sm font-medium tabular-nums text-muted-foreground">
            {formatPrice(app.price)}
          </span>
        ) : (
          <Badge
            variant="secondary"
            className="gap-1.5 border-primary/20 bg-accent text-accent-foreground"
          >
            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
            Active
          </Badge>
        )}
      </div>

      <div className={cn("flex flex-col gap-1", isLocked && "opacity-70")}>
        <h3 className="text-base font-semibold tracking-tight">{app.name}</h3>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          {app.description}
        </p>
      </div>

      <div className="mt-auto pt-1">
        {isLocked ? (
          <Button
            variant="outline"
            className="w-full"
            tabIndex={-1}
            onClick={handleActivate}
          >
            <Lock className="size-4" aria-hidden="true" />
            Unlock
          </Button>
        ) : (
          <Button className="w-full" tabIndex={-1} onClick={handleActivate}>
            Open
          </Button>
        )}
      </div>
    </Card>
  )
}
