"use client"

import { useMemo, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MEDICAL_STATUSES, TRAINING_STATUSES } from "@/lib/hspec"
import { cn } from "@/lib/utils"

export type BoardAthlete = {
  id: string
  name: string
  position: string
  medicalStatus: string
  trainingStatus: string
  groups: string[]
  flags: string[]
  notes: string[]
}

const colorClass: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-800 border-emerald-200",
  blue: "bg-sky-100 text-sky-800 border-sky-200",
  amber: "bg-amber-100 text-amber-900 border-amber-200",
  red: "bg-red-100 text-red-800 border-red-200",
  purple: "bg-violet-100 text-violet-800 border-violet-200",
  gray: "bg-slate-100 text-slate-700 border-slate-200",
}

function chipColor(kind: "medical" | "training", slug: string) {
  const list = kind === "medical" ? MEDICAL_STATUSES : TRAINING_STATUSES
  return colorClass[list.find((s) => s.slug === slug)?.color ?? "gray"]
}

function labelFor(kind: "medical" | "training", slug: string) {
  const list = kind === "medical" ? MEDICAL_STATUSES : TRAINING_STATUSES
  return list.find((s) => s.slug === slug)?.label ?? slug
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

type Props = {
  athletes: BoardAthlete[]
  teamName?: string
  /** Persist status change when DB is available; mock mode updates local state only. */
  onStatusChange?: (athleteId: string, trainingStatus: string) => Promise<void> | void
}

export function VisualBoard({
  athletes: initial,
  teamName = "Team",
  onStatusChange,
}: Props) {
  const [athletes, setAthletes] = useState(initial)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  const selected = athletes.find((a) => a.id === selectedId) ?? null

  const columns = useMemo(() => TRAINING_STATUSES, [])

  async function moveAthlete(athleteId: string, trainingStatus: string) {
    const current = athletes.find((a) => a.id === athleteId)
    if (!current || current.trainingStatus === trainingStatus) return

    setAthletes((prev) =>
      prev.map((a) => (a.id === athleteId ? { ...a, trainingStatus } : a)),
    )
    await onStatusChange?.(athleteId, trainingStatus)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>
          Team: <strong className="text-foreground">{teamName}</strong>
        </span>
        <span className="text-border">·</span>
        <span>{athletes.length} athletes</span>
        <span className="text-border">·</span>
        <span>Drag cards between columns, or use Move on a card</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((col) => {
          const list = athletes.filter((a) => a.trainingStatus === col.slug)
          return (
            <section
              key={col.slug}
              className={cn(
                "flex w-[272px] shrink-0 flex-col gap-2 rounded-2xl border bg-muted/40 p-2.5",
                dragOverCol === col.slug && "outline outline-2 outline-primary/40",
              )}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverCol(col.slug)
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOverCol(null)
                const id = e.dataTransfer.getData("text/athlete-id") || draggingId
                if (id) void moveAthlete(id, col.slug)
                setDraggingId(null)
              }}
            >
              <div className="flex items-center justify-between px-1 py-1">
                <h3 className="text-sm font-semibold leading-tight">{col.label}</h3>
                <span className="text-xs font-medium text-muted-foreground">
                  {list.length}
                </span>
              </div>

              {list.map((a) => (
                <article
                  key={a.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggingId(a.id)
                    e.dataTransfer.setData("text/athlete-id", a.id)
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  onClick={() => setSelectedId(a.id)}
                  className="cursor-grab rounded-xl border bg-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
                >
                  <div className="flex gap-2.5">
                    <Avatar className="size-9">
                      <AvatarFallback className="text-xs font-semibold">
                        {initials(a.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{a.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {a.position || "Athlete"}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {a.groups.slice(0, 2).map((g) => (
                          <Badge key={g} variant="secondary" className="text-[10px]">
                            {g}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        chipColor("medical", a.medicalStatus),
                      )}
                    >
                      {labelFor("medical", a.medicalStatus)}
                    </span>
                    {a.flags.map((f) => (
                      <Badge key={f} variant="outline" className="text-[10px]">
                        {f}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={a.trainingStatus}
                      onValueChange={(v) => {
                        if (v) void moveAthlete(a.id, v)
                      }}
                    >
                      <SelectTrigger size="sm" className="h-7 text-xs">
                        <SelectValue placeholder="Move…" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((c) => (
                          <SelectItem key={c.slug} value={c.slug}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </article>
              ))}

              {list.length === 0 && (
                <div className="rounded-xl border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  Drop athlete here
                </div>
              )}
            </section>
          )
        })}
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarFallback>{initials(selected.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div>{selected.name}</div>
                    <div className="text-sm font-normal text-muted-foreground">
                      {selected.position}
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <Tabs defaultValue="overview" className="mt-4 px-1">
                <TabsList className="w-full">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="status">Status</TabsTrigger>
                  <TabsTrigger value="flags">Flags</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-semibold",
                        chipColor("training", selected.trainingStatus),
                      )}
                    >
                      {labelFor("training", selected.trainingStatus)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-semibold",
                        chipColor("medical", selected.medicalStatus),
                      )}
                    >
                      {labelFor("medical", selected.medicalStatus)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cross-app snapshot. Widgets and latest outputs from SMFT / Survey /
                    Session will appear here once those apps publish to the Hub.
                  </p>
                </TabsContent>

                <TabsContent value="status" className="mt-4 space-y-3">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Training status
                  </label>
                  <Select
                    value={selected.trainingStatus}
                    onValueChange={(v) => {
                      if (v) void moveAthlete(selected.id, v)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Every change is audited (who / when / old → new) once the database
                    migration is applied.
                  </p>
                </TabsContent>

                <TabsContent value="flags" className="mt-4 space-y-2">
                  {selected.flags.length === 0 && (
                    <p className="text-sm text-muted-foreground">No active flags</p>
                  )}
                  {selected.flags.map((f) => (
                    <div key={f} className="rounded-xl border p-3">
                      <div className="font-semibold text-sm">{f}</div>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="outline">
                          Acknowledge
                        </Button>
                        <Button size="sm" variant="outline">
                          Resolve
                        </Button>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="notes" className="mt-4 space-y-2">
                  {selected.notes.length === 0 && (
                    <p className="text-sm text-muted-foreground">No notes yet</p>
                  )}
                  {selected.notes.map((n, i) => (
                    <div key={i} className="rounded-xl border p-3 text-sm">
                      {n}
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
