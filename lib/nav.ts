/**
 * HSpec Hub navigation — Core / Apps / Admin (mockup layout).
 */

export type NavItem = {
  title: string
  href: string
  /** lucide icon name key resolved in the sidebar */
  icon:
    | "home"
    | "board"
    | "calendar"
    | "sync"
    | "dashboard"
    | "session"
    | "survey"
    | "testing"
    | "hiit"
    | "asp"
    | "diary"
    | "settings"
    | "apps"
    | "team"
    | "profile"
    | "admin"
  section: "core" | "apps" | "admin"
  /** Staff/coach only for now (athletes have no login in MVP). */
  coachOnly?: boolean
  adminOnly?: boolean
}

export const HUB_NAV: NavItem[] = [
  { title: "Hub", href: "/dashboard", icon: "home", section: "core" },
  { title: "Visual Board", href: "/board", icon: "board", section: "core", coachOnly: true },
  { title: "Team Calendar", href: "/calendar", icon: "calendar", section: "core", coachOnly: true },
  { title: "Sync Tool", href: "/sync", icon: "sync", section: "core", coachOnly: true },
  { title: "Dashboard", href: "/analysis", icon: "dashboard", section: "core", coachOnly: true },

  { title: "Session Tool", href: "/modules/session", icon: "session", section: "apps", coachOnly: true },
  { title: "Survey Tool", href: "/modules/survey", icon: "survey", section: "apps", coachOnly: true },
  { title: "Testing / SMFT", href: "/modules/smft", icon: "testing", section: "apps", coachOnly: true },
  { title: "HIIT Builder", href: "/modules/hiit", icon: "hiit", section: "apps", coachOnly: true },
  { title: "Agile Strength", href: "/modules/asp", icon: "asp", section: "apps", coachOnly: true },
  { title: "Training Diary", href: "/modules/diary", icon: "diary", section: "apps", coachOnly: true },
  { title: "My apps", href: "/apps", icon: "apps", section: "apps" },

  { title: "Team", href: "/coach/team", icon: "team", section: "admin", coachOnly: true },
  { title: "Settings", href: "/settings", icon: "settings", section: "admin", coachOnly: true },
  { title: "Profile", href: "/profile", icon: "profile", section: "admin" },
  { title: "Admin", href: "/admin", icon: "admin", section: "admin", adminOnly: true },
]

export const NAV_SECTIONS = [
  { id: "core" as const, label: "Core" },
  { id: "apps" as const, label: "Apps & modules" },
  { id: "admin" as const, label: "Admin" },
]
