"use client"

import { useTransition } from "react"

import { updateOrganizationAction } from "@/app/actions/profile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type OrganizationSettingsCardProps = {
  name: string
  sport: string
}

export function OrganizationSettingsCard({
  name,
  sport,
}: OrganizationSettingsCardProps) {
  const [pending, startTransition] = useTransition()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Organization</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          key={`${name}::${sport}`}
          className="flex flex-col gap-4"
          action={(formData) => {
            startTransition(() => updateOrganizationAction(formData))
          }}
        >
          <p className="text-sm text-muted-foreground">
            Your organization groups teams and athletes. Each coach runs their
            own organization — different sports and coaches stay separate.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="org-name">Organization name</Label>
              <Input
                id="org-name"
                name="name"
                defaultValue={name}
                placeholder="Apex Performance"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="org-sport">Sport / discipline</Label>
              <Input
                id="org-sport"
                name="sport"
                defaultValue={sport}
                placeholder="MMA, Cycling, Football…"
              />
            </div>
          </div>

          <div>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Save organization"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
