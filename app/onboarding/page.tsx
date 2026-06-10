import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { Hexagon, Dumbbell, Users, ArrowRight } from "lucide-react"

import { HardRedirect } from "@/components/platform/hard-redirect"
import { db } from "@/lib/db"
import { markOnboardingComplete, syncClerkEmail } from "@/lib/onboarding"
import type { UserRole } from "@/types"

async function setAthleteRole(formData: FormData) {
  "use server"

  const role = formData.get("role") as UserRole
  if (role !== "athlete") return

  const { userId } = await auth()
  if (!userId) redirect("/login")

  const email = await syncClerkEmail(userId)
  if (!email) redirect("/login")

  await markOnboardingComplete(userId, "athlete")

  await db.user.upsert({
    where: { clerkId: userId },
    create: { clerkId: userId, email, role: "athlete" },
    update: { role: "athlete" },
  })

  redirect("/dashboard")
}

export default async function OnboardingPage() {
  const { userId } = await auth()
  if (!userId) return <HardRedirect to="/login" />

  const existing = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  })
  if (existing) return <HardRedirect to="/dashboard" />

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Hexagon className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight">
              How will you use Hub?
            </h1>
            <p className="text-sm text-muted-foreground">
              Choose Athlete to start right away. Coach setup requires creating
              an organization and team.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <form action={setAthleteRole}>
            <input type="hidden" name="role" value="athlete" />
            <button
              type="submit"
              className="w-full rounded-xl border border-border bg-card p-6 text-left transition-colors hover:border-foreground/30 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Dumbbell className="mb-3 size-7 text-primary" />
              <p className="font-semibold tracking-tight">Athlete</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Track your own training, recovery, and performance.
              </p>
            </button>
          </form>

          <Link
            href="/onboarding/coach"
            className="flex w-full flex-col rounded-xl border border-border bg-card p-6 text-left transition-colors hover:border-foreground/30 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Users className="mb-3 size-7 text-primary" />
            <p className="font-semibold tracking-tight">Coach</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up your organization, create a team, and invite athletes.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
              Continue setup
              <ArrowRight className="size-3.5" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
