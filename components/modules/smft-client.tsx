"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { createSmftResultAction } from "@/app/actions/hub"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SmftDirection } from "@/lib/smft"

type AthleteOption = { id: string; name: string }

type ResultRow = {
  id: string
  athlete: { id: string; name: string }
  metric: string
  value: number
  unit: string
  direction: SmftDirection
  testedAt: string
  createdAt: Date | string
  authorEmail: string | null
}

type Props = {
  athletes: AthleteOption[]
  results: ResultRow[]
}

const DIRECTIONS: { value: SmftDirection; label: string }[] = [
  { value: "down", label: "Down — raise SMFT down flag" },
  { value: "up", label: "Up — raise SMFT up flag" },
  { value: "stable", label: "Stable — no flag" },
  { value: "none", label: "None — log only" },
]

export function SmftClient({ athletes, results }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [athleteId, setAthleteId] = useState(athletes[0]?.id ?? "")
  const [metric, setMetric] = useState("MAS")
  const [value, setValue] = useState("")
  const [unit, setUnit] = useState("m/s")
  const [direction, setDirection] = useState<SmftDirection>("down")
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <form
        className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3"
        action={(fd) => {
          setError(null)
          startTransition(async () => {
            try {
              await createSmftResultAction(fd)
              setValue("")
              router.refresh()
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to save result.")
            }
          })
        }}
      >
        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
          <Label>Athlete</Label>
          <Select
            value={athleteId}
            onValueChange={(v) => {
              if (v) setAthleteId(v)
            }}
            disabled={athletes.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select athlete" />
            </SelectTrigger>
            <SelectContent>
              {athletes.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="athleteId" value={athleteId} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="metric">Metric</Label>
          <Input
            id="metric"
            name="metric"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            placeholder="MAS"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="value">Value</Label>
          <Input
            id="value"
            name="value"
            type="number"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="4.2"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            name="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="m/s"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
          <Label>Trend / flag</Label>
          <Select
            value={direction}
            onValueChange={(v) => {
              if (v) setDirection(v as SmftDirection)
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIRECTIONS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="direction" value={direction} />
        </div>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
          <Button type="submit" disabled={pending || !athleteId}>
            {pending ? "Saving…" : "Save result"}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive sm:col-span-2 lg:col-span-3">
            {error}
          </p>
        )}
        {athletes.length === 0 && (
          <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
            Add athletes on the Visual Board before logging SMFT results.
          </p>
        )}
      </form>

      <div className="space-y-2">
        <h2 className="text-sm font-medium">Recent results</h2>
        {results.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No SMFT entries yet. Manual capture only — BLE live testing is
            descoped.
          </p>
        )}
        {results.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
          >
            <div>
              <div className="font-medium">
                {r.athlete.name} · {r.metric}{" "}
                <span className="tabular-nums">
                  {r.value} {r.unit}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {r.direction}
                {r.authorEmail ? ` · ${r.authorEmail}` : ""}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(r.testedAt || r.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
