import type * as React from "react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { HubSidebar } from "@/components/platform/hub-sidebar"
import { TopBar } from "@/components/platform/top-bar"

interface AppShellProps {
  title: string
  searchPlaceholder?: string
  /** Wider content for board/calendar layouts. */
  wide?: boolean
  children: React.ReactNode
}

export function AppShell({
  title,
  searchPlaceholder,
  wide = false,
  children,
}: AppShellProps) {
  return (
    <SidebarProvider>
      <HubSidebar />
      <SidebarInset>
        <TopBar title={title} searchPlaceholder={searchPlaceholder} />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <div
            className={
              wide
                ? "mx-auto w-full max-w-[1800px]"
                : "mx-auto w-full max-w-6xl"
            }
          >
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
