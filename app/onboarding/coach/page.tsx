import { redirect } from "next/navigation"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { Hexagon, Users } from "lucide-react"

import { becomeCoachAction } from "@/app/actions/coach-onboarding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { db } from "@/lib/db"
import { syncClerkEmail } from "@/lib/users"

export default async function CoachOnboardingPage() {
  const { userId } = await auth()
  if (!userId) redirect("/login")

  const email = await syncClerkEmail(userId)
  if (!email) redirect("/login")

  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    include: { organization: true },
  })

  if (dbUser?.role === "coach" && dbUser.organization) {
    redirect("/coach/team")
  }

  if (!dbUser) {
    const client = await clerkClient()
    await client.users.updateUser(userId, {
      publicMetadata: { role: "athlete" },
    })
    await db.user.create({
      data: { clerkId: userId, email, role: "athlete" },
    })
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="flex w-full max-w-lg flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Hexagon className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <Users className="mx-auto size-7 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">
              Set up your coaching workspace
            </h1>
            <p className="text-sm text-muted-foreground">
              Create your organization and first team before you can invite
              athletes and manage a roster.
            </p>
          </div>
        </div>

        <form action={becomeCoachAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              name="orgName"
              placeholder="Apex Performance"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="org-sport">Sport / discipline</Label>
            <Input
              id="org-sport"
              name="sport"
              placeholder="MMA, Cycling, Football…"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="team-name">First team name</Label>
            <Input
              id="team-name"
              name="teamName"
              placeholder="Main squad, Elite group…"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Create organization &amp; become a coach
          </Button>
        </form>
      </div>
    </div>
  )
}
