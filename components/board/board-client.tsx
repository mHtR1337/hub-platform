"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  VisualBoard,
  type BoardAthlete,
} from "@/components/board/visual-board"
import {
  createAthleteAction,
  updateTrainingStatusAction,
} from "@/app/actions/hub"
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
import { TRAINING_STATUSES } from "@/lib/hspec"
import { useState } from "react"

type Props = {
  athletes: BoardAthlete[]
  teamName: string
  teamId: string | null
  usingDemo: boolean
}

export function BoardClient({ athletes, teamName, teamId, usingDemo }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [position, setPosition] = useState("")
  const [trainingStatus, setTrainingStatus] = useState(
    "full-training-competition",
  )

  return (
    <div className="flex flex-col gap-4">
      {!usingDemo && (
        <form
          className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4"
          action={(fd) => {
            startTransition(async () => {
              await createAthleteAction(fd)
              setName("")
              setPosition("")
              router.refresh()
            })
          }}
        >
          <div className="flex min-w-40 flex-1 flex-col gap-1.5">
            <Label htmlFor="name">Add athlete</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
            />
          </div>
          <div className="flex min-w-32 flex-col gap-1.5">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              name="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Midfielder"
            />
          </div>
          <input type="hidden" name="teamId" value={teamId ?? ""} />
          <input type="hidden" name="trainingStatus" value={trainingStatus} />
          <div className="flex min-w-48 flex-col gap-1.5">
            <Label>Training status</Label>
            <Select value={trainingStatus} onValueChange={(v) => v && setTrainingStatus(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRAINING_STATUSES.map((s) => (
                  <SelectItem key={s.slug} value={s.slug}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? "Saving…" : "＋ Athlete"}
          </Button>
        </form>
      )}

      <VisualBoard
        athletes={athletes}
        teamName={teamName}
        onStatusChange={
          usingDemo
            ? undefined
            : async (athleteId, nextStatus) => {
                startTransition(async () => {
                  await updateTrainingStatusAction(athleteId, nextStatus)
                  router.refresh()
                })
              }
        }
      />
    </div>
  )
}
