"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  LayoutGrid,
  User,
  Shield,
  Hexagon,
  Users,
  Kanban,
  CalendarDays,
  ArrowLeftRight,
  ChartColumn,
  ClipboardList,
  ClipboardCheck,
  HeartPulse,
  Zap,
  Dumbbell,
  NotebookPen,
  Settings,
} from "lucide-react"
import { useUser } from "@clerk/nextjs"

import { LogoutButton } from "@/components/platform/logout-button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HUB_NAV, NAV_SECTIONS, type NavItem } from "@/lib/nav"
import type { UserRole } from "@/types"

const iconMap = {
  home: Hexagon,
  board: Kanban,
  calendar: CalendarDays,
  sync: ArrowLeftRight,
  dashboard: ChartColumn,
  session: ClipboardList,
  survey: ClipboardCheck,
  testing: HeartPulse,
  hiit: Zap,
  asp: Dumbbell,
  diary: NotebookPen,
  settings: Settings,
  apps: LayoutGrid,
  team: Users,
  profile: User,
  admin: Shield,
} as const

function initialsFor(name: string, email?: string | null): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  if (email) return email.slice(0, 2).toUpperCase()
  return "U"
}

function isVisible(item: NavItem, role: UserRole) {
  if (item.adminOnly && role !== "admin") return false
  if (item.coachOnly && role !== "coach" && role !== "admin") return false
  return true
}

export function HubSidebar() {
  const pathname = usePathname()
  const { user, isLoaded } = useUser()
  const role = (user?.publicMetadata?.role as UserRole | undefined) ?? "athlete"

  const displayName =
    user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "User"
  const displayEmail = user?.primaryEmailAddress?.emailAddress ?? ""
  const displayRole = role.charAt(0).toUpperCase() + role.slice(1)

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-md px-2 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Hexagon className="size-4.5" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="text-base font-semibold tracking-tight">HSpec Hub</span>
            <span className="truncate text-[11px] text-muted-foreground">
              performance OS
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {NAV_SECTIONS.map((section) => {
          const items = HUB_NAV.filter(
            (item) => item.section === section.id && isVisible(item, role),
          )
          if (items.length === 0) return null
          return (
            <SidebarGroup key={section.id}>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const Icon = iconMap[item.icon] ?? LayoutDashboard
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`)
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          render={<Link href={item.href} />}
                          isActive={isActive}
                          tooltip={item.title}
                        >
                          <Icon />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-sidebar-border p-2">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-md px-2 py-2 outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-accent text-xs font-medium text-accent-foreground">
              {isLoaded ? initialsFor(displayName, displayEmail) : "…"}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">
              {isLoaded ? displayName : "Loading…"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {isLoaded ? displayRole : ""}
            </span>
          </div>
        </Link>

        <LogoutButton />
      </SidebarFooter>
    </Sidebar>
  )
}
