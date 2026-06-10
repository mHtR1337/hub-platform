"use client"

import { useState, useTransition } from "react"
import { Copy, UserPlus } from "lucide-react"

import {
  createTeamAction,
  inviteAthleteAction,
  revokeAthleteAction,
} from "@/app/actions/profile"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type TeamOption = { id: string; name: string }

type RosterRow = {
  id: string
  status: string
  inviteEmail: string | null
  inviteToken: string | null
  athlete: { email: string } | null
  team: { name: string } | null
}

type CoachTeamManagerProps = {
  organizationName: string
  teams: TeamOption[]
  roster: RosterRow[]
}

function statusVariant(status: string) {
  if (status === "active") return "default" as const
  if (status === "pending") return "secondary" as const
  return "outline" as const
}

export function CoachTeamManager({
  organizationName,
  teams,
  roster,
}: CoachTeamManagerProps) {
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? "")
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function copyInviteUrl(url: string) {
    void navigator.clipboard.writeText(url)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Teams in {organizationName}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            action={(formData) => {
              startTransition(async () => {
                setError(null)
                try {
                  await createTeamAction(formData)
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to create team")
                }
              })
            }}
          >
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="team-name">New team</Label>
              <Input
                id="team-name"
                name="name"
                placeholder="Elite squad, U18, Competition group…"
                required
              />
            </div>
            <Button type="submit" disabled={pending}>
              Create team
            </Button>
          </form>
          {teams.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {teams.map((team) => (
                <Badge key={team.id} variant="outline">
                  {team.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite athlete</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Add an athlete by email. If they don&apos;t have a Hub account yet,
            share the invite link with them — they must sign up using that exact
            email.
          </p>

          <form
            className="flex flex-col gap-4"
            action={(formData) => {
              startTransition(async () => {
                setError(null)
                setInviteUrl(null)
                formData.set("teamId", selectedTeamId)
                try {
                  const result = await inviteAthleteAction(formData)
                  if (result.inviteUrl) {
                    setInviteUrl(result.inviteUrl)
                  }
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Failed to invite athlete",
                  )
                }
              })
            }}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="athlete-email">Athlete email</Label>
                <Input
                  id="athlete-email"
                  name="email"
                  type="email"
                  placeholder="athlete@example.com"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Team</Label>
                <Select
                  value={selectedTeamId}
                  onValueChange={(value) => {
                    if (value) setSelectedTeamId(value)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={pending || teams.length === 0}>
              <UserPlus className="size-4" />
              {pending ? "Inviting…" : "Invite athlete"}
            </Button>
          </form>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {inviteUrl && (
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium">Share this invite link</p>
              <p className="mt-1 break-all text-sm text-muted-foreground">
                {inviteUrl}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => copyInviteUrl(inviteUrl)}
              >
                <Copy className="size-4" />
                Copy link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Roster</CardTitle>
        </CardHeader>
        <CardContent>
          {roster.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No athletes yet. Invite someone to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.map((row) => {
                  const email = row.athlete?.email ?? row.inviteEmail ?? "—"
                  return (
                    <TableRow key={row.id}>
                      <TableCell>{email}</TableCell>
                      <TableCell>{row.team?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.status)}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <form
                          action={(formData) => {
                            startTransition(() => revokeAthleteAction(formData))
                          }}
                        >
                          <input
                            type="hidden"
                            name="relationshipId"
                            value={row.id}
                          />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                          >
                            Remove
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
