import type * as React from "react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { HubSidebar } from "@/components/hub-sidebar"
import { TopBar } from "@/components/top-bar"

interface AppShellProps {
  title: string
  searchPlaceholder?: string
  children: React.ReactNode
}

export function AppShell({ title, searchPlaceholder, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <HubSidebar />
      <SidebarInset>
        <TopBar title={title} searchPlaceholder={searchPlaceholder} />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
