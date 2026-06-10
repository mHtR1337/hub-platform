import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { Hexagon } from "lucide-react"

import { InviteAcceptCard } from "@/components/coach/invite-accept-card"
import { getInvitePreview } from "@/lib/coach"

type InvitePageProps = {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  const invite = await getInvitePreview(token)
  if (!invite) notFound()

  const { userId } = await auth()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Hexagon className="size-5" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Team invite</h1>
      </div>

      <InviteAcceptCard
        token={token}
        organizationName={invite.coach.organization?.name ?? "Coach team"}
        sport={invite.coach.organization?.sport ?? ""}
        teamName={invite.team?.name ?? null}
        coachEmail={invite.coach.email}
        inviteEmail={invite.inviteEmail}
        isSignedIn={Boolean(userId)}
      />
    </div>
  )
}
