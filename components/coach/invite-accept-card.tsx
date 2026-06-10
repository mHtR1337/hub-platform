"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type InviteAcceptCardProps = {
  token: string
  organizationName: string
  sport: string
  teamName: string | null
  coachEmail: string
  inviteEmail: string | null
  isSignedIn: boolean
}

export function InviteAcceptCard({
  token,
  organizationName,
  sport,
  teamName,
  coachEmail,
  inviteEmail,
  isSignedIn,
}: InviteAcceptCardProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function acceptInvite() {
    startTransition(async () => {
      setError(null)
      const response = await fetch("/api/coach/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error ?? "Could not accept invite")
        return
      }
      router.push("/dashboard")
      router.refresh()
    })
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Join {organizationName}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{coachEmail}</span> invited
          you to join their team on Hub.
        </p>

        <dl className="grid grid-cols-1 gap-2 text-sm">
          {sport && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Sport</dt>
              <dd>{sport}</dd>
            </div>
          )}
          {teamName && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Team</dt>
              <dd>{teamName}</dd>
            </div>
          )}
          {inviteEmail && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Invited email</dt>
              <dd>{inviteEmail}</dd>
            </div>
          )}
        </dl>

        {!isSignedIn ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Sign up or log in with{" "}
              <span className="font-medium text-foreground">{inviteEmail}</span>{" "}
              to accept this invite.
            </p>
            <Button render={<Link href={`/signup?redirect_url=/invite/${token}`} />}>
              Create account
            </Button>
            <Button
              variant="outline"
              render={<Link href={`/login?redirect_url=/invite/${token}`} />}
            >
              Log in
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button onClick={acceptInvite} disabled={pending}>
              {pending ? "Joining…" : "Accept invite"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
