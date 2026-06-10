"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, LayoutGrid, User, Shield, Hexagon } from "lucide-react"

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
import { account } from "@/lib/account"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "My apps", href: "/apps", icon: LayoutGrid },
  { title: "Profile", href: "/profile", icon: User },
  { title: "Admin", href: "/admin", icon: Shield },
]

export function HubSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-2 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring rounded-md"
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
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
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

      <SidebarFooter className="border-t border-sidebar-border">
        <Link
          href="/profile"
          className="flex items-center gap-3 px-2 py-2 rounded-md outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-accent text-accent-foreground text-xs font-medium">
              {account.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{account.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {account.role}
            </span>
          </div>
        </Link>
      </SidebarFooter>
    </Sidebar>
  )
}
