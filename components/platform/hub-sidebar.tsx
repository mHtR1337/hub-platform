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
} from "lucide-react"
import { useUser } from "@clerk/nextjs"

import { LogoutButton } from "@/components/platform/logout-button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { UserRole } from "@/types"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, adminOnly: false, coachOnly: false },
  { title: "My apps", href: "/apps", icon: LayoutGrid, adminOnly: false, coachOnly: false },
  { title: "Team", href: "/coach/team", icon: Users, adminOnly: false, coachOnly: true },
  { title: "Profile", href: "/profile", icon: User, adminOnly: false, coachOnly: false },
  { title: "Admin", href: "/admin", icon: Shield, adminOnly: true, coachOnly: false },
]

function initialsFor(name: string, email?: string | null): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  if (email) return email.slice(0, 2).toUpperCase()
  return "U"
}

export function HubSidebar() {
  const pathname = usePathname()
  const { user, isLoaded } = useUser()
  const role = (user?.publicMetadata?.role as UserRole | undefined) ?? "athlete"

  const visibleNavItems = navItems.filter((item) => {
    if (item.adminOnly && role !== "admin") return false
    if (item.coachOnly && role !== "coach") return false
    return true
  })

  const displayName =
    user?.fullName ??
    user?.primaryEmailAddress?.emailAddress ??
    "User"
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
          <span className="text-base font-semibold tracking-tight">Hub</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-sidebar-border p-2">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-md px-2 py-2 outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-accent text-xs font-medium text-accent-foreground">
              {isLoaded
                ? initialsFor(displayName, displayEmail)
                : "…"}
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
