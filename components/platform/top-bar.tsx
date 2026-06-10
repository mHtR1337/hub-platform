"use client"

import { Bell, Search } from "lucide-react"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/theme-toggle"

interface TopBarProps {
  title: string
  searchPlaceholder?: string
}

export function TopBar({ title, searchPlaceholder = "Search apps..." }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="md:hidden" />
      <Separator orientation="vertical" className="h-6 md:hidden" />

      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-48 pl-9 lg:w-64"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="size-4.5" />
          <span
            className="absolute right-2 top-2 size-1.5 rounded-full bg-primary"
            aria-hidden="true"
          />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  )
}
