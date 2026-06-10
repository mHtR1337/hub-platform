import { redirect } from 'next/navigation'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { Hexagon, Dumbbell, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { UserRole } from '@/types'

async function setRole(formData: FormData) {
  'use server'
  const role = formData.get('role') as UserRole
  if (role !== 'athlete' && role !== 'coach') return

  const { userId } = await auth()
  if (!userId) redirect('/login')

  const client = await clerkClient()
  await client.users.updateUser(userId, {
    publicMetadata: { role },
  })

  redirect('/dashboard')
}

export default async function OnboardingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

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
              This sets up your experience. You can't change this later.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <form action={setRole}>
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

          <form action={setRole}>
            <input type="hidden" name="role" value="coach" />
            <button
              type="submit"
              className="w-full rounded-xl border border-border bg-card p-6 text-left transition-colors hover:border-foreground/30 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Users className="mb-3 size-7 text-primary" />
              <p className="font-semibold tracking-tight">Coach</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage athletes and monitor their data across all apps.
              </p>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
