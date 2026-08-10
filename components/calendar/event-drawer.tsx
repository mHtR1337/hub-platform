"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  setEventParticipantsAction,
  upsertAttendanceAction,
} from "@/app/actions/hub"
import { ATTENDANCE_OPTIONS, EVENT_TYPES } from "@/lib/hspec"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export type EventAthleteOption = {
  id: string
  name: string
  position: string
}

export type EventDrawerData = {
  id: string
  title: string
  type: string
  timeLabel: string
  location: string
  participantIds: string[]
  attendance: Record<string, string>
}

type Props = {
  event: EventDrawerData | null
  athletes: EventAthleteOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function EventDrawer({ event, athletes, open, onOpenChange }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    setSelected(event?.participantIds ?? [])
  }, [event])

  if (!event) return null

  const typeLabel =
    EVENT_TYPES.find((t) => t.slug === event.type)?.label ?? event.type

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{event.title}</SheetTitle>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="secondary">{typeLabel}</Badge>
            <Badge variant="outline">{event.timeLabel}</Badge>
            {event.location ? (
              <Badge variant="outline">{event.location}</Badge>
            ) : null}
          </div>
        </SheetHeader>

        <Tabs defaultValue="participants" className="mt-4 px-1">
          <TabsList className="w-full">
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="participants" className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Select athletes expected at this event.
            </p>
            <div className="max-h-80 space-y-2 overflow-auto">
              {athletes.map((a) => {
                const on = selected.includes(a.id)
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() =>
                      setSelected((prev) =>
                        prev.includes(a.id)
                          ? prev.filter((x) => x !== a.id)
                          : [...prev, a.id],
                      )
                    }
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition",
                      on
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="text-[10px]">
                        {initials(a.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{a.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {a.position || "Athlete"}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {on ? "✓" : ""}
                    </span>
                  </button>
                )
              })}
            </div>
            <Button
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  await setEventParticipantsAction(event.id, selected)
                  router.refresh()
                })
              }}
            >
              {pending ? "Saving…" : "Save participants"}
            </Button>
          </TabsContent>

          <TabsContent value="attendance" className="mt-4 space-y-3">
            {selected.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add participants first.
              </p>
            ) : (
              selected.map((id) => {
                const a = athletes.find((x) => x.id === id)
                if (!a) return null
                const status = event.attendance[id] ?? "full"
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 rounded-xl border px-3 py-2"
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="text-[10px]">
                        {initials(a.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{a.name}</div>
                    </div>
                    <Select
                      value={status}
                      onValueChange={(v) => {
                        if (!v) return
                        startTransition(async () => {
                          await upsertAttendanceAction(event.id, id, v)
                          router.refresh()
                        })
                      }}
                    >
                      <SelectTrigger size="sm" className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTENDANCE_OPTIONS.map((o) => (
                          <SelectItem key={o.slug} value={o.slug}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              })
            )}
          </TabsContent>

          <TabsContent
            value="overview"
            className="mt-4 space-y-2 text-sm text-muted-foreground"
          >
            <p>
              Linked apps (Session, Survey, SMFT, HIIT PDF) attach here later via
              LinkedRecord.
            </p>
            <p>
              {selected.length} participants ·{" "}
              {Object.keys(event.attendance).length} attendance rows
            </p>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
