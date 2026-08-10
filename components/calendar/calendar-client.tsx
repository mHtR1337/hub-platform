"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { createEventAction } from "@/app/actions/hub"
import { EVENT_TYPES } from "@/lib/hspec"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type CalendarEventCard = {
  id: string
  dayIndex: number
  title: string
  type: string
  timeLabel: string
  location: string
  participantCount: number
}

type Props = {
  weekLabel: string
  dayLabels: string[]
  events: CalendarEventCard[]
  teamId: string | null
  canCreate: boolean
}

export function CalendarClient({
  weekLabel,
  dayLabels,
  events,
  teamId,
  canCreate,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [type, setType] = useState("training")
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team Calendar</h1>
          <p className="text-sm text-muted-foreground">
            {weekLabel} · time spine for sessions, surveys and linked app records.
          </p>
        </div>
        {canCreate && (
          <Button type="button" onClick={() => setOpen((v) => !v)}>
            {open ? "Close" : "＋ Create event"}
          </Button>
        )}
      </div>

      {open && canCreate && (
        <form
          className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-5"
          action={(fd) => {
            startTransition(async () => {
              await createEventAction(fd)
              setOpen(false)
              router.refresh()
            })
          }}
        >
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Field Training" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <input type="hidden" name="type" value={type} />
            <Select value={type} onValueChange={(v) => v && setType(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.slug} value={t.slug}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="startsAt">Starts</Label>
            <Input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="Pitch 1" />
          </div>
          <input type="hidden" name="teamId" value={teamId ?? ""} />
          <div className="md:col-span-5">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Create event"}
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-3 md:grid-cols-7">
        {dayLabels.map((day, i) => (
          <Card key={day} className="min-h-48">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-sm">{day}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3 pt-0">
              {events
                .filter((e) => e.dayIndex === i)
                .map((e) => {
                  const meta = EVENT_TYPES.find((t) => t.slug === e.type)
                  return (
                    <div
                      key={e.id}
                      className="rounded-lg border border-l-4 border-l-primary bg-card p-2 text-xs shadow-sm"
                    >
                      <div className="font-semibold">{e.title}</div>
                      <div className="text-muted-foreground">{e.timeLabel}</div>
                      {e.location ? (
                        <div className="text-muted-foreground">{e.location}</div>
                      ) : null}
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {meta?.label ?? e.type}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {e.participantCount} athletes
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              {events.filter((e) => e.dayIndex === i).length === 0 && (
                <div className="rounded-lg border border-dashed px-2 py-6 text-center text-[11px] text-muted-foreground">
                  No events
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
