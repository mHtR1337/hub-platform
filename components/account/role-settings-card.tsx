"use client"

import Link from "next/link"
import { Dumbbell, Users, ArrowRight } from "lucide-react"

import { switchToAthleteAction } from "@/app/actions/coach-onboarding"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { UserRole } from "@/types"

type RoleSettingsCardProps = {
  currentRole: UserRole
  hasOrganization: boolean
}

export function RoleSettingsCard({
  currentRole,
  hasOrganization,
}: RoleSettingsCardProps) {
  if (currentRole === "admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account mode</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Admin accounts use a fixed role.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (currentRole === "coach") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account mode</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Badge>Coach</Badge>
            {hasOrganization && (
              <span className="text-sm text-muted-foreground">
                Organization active
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            You manage teams and athletes in Coach mode. Switch back to Athlete
            if you only want to track your own data.
          </p>
          <form action={switchToAthleteAction}>
            <Button type="submit" variant="outline" size="sm">
              Switch to Athlete mode
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Account mode</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Athlete</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Becoming a coach requires setting up an organization and your first
          team. This is a separate setup step — not an instant switch.
        </p>
        <Button
          render={<Link href="/onboarding/coach" />}
          className="w-fit gap-2"
        >
          <Users className="size-4" />
          Set up coach account
          <ArrowRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
