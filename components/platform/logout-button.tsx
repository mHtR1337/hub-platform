"use client"

import { LogOut } from "lucide-react"
import { useClerk } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const { signOut } = useClerk()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 text-muted-foreground"
      onClick={() => signOut({ redirectUrl: "/login" })}
    >
      <LogOut className="size-4" />
      Log out
    </Button>
  )
}
