export type UserStatus = "active" | "trialing" | "canceled"

export interface PlatformUser {
  id: string
  name: string
  email: string
  initials: string
  plan: string
  unlockedApps: string[]
  status: UserStatus
  joined: string
}

export const adminStats = {
  mrr: 18420,
  mrrDelta: 12.4,
  activeSubscriptions: 1284,
  activeSubsDelta: 8.1,
  totalUsers: 3960,
  totalUsersDelta: 5.3,
  mostPopularApp: "HRV Monitor",
  mostPopularShare: 47,
}

export interface AppBreakdown {
  app: string
  subscribers: number
}

export const subscriptionsByApp: AppBreakdown[] = [
  { app: "HRV Monitor", subscribers: 604 },
  { app: "Combat Tracker", subscribers: 421 },
  { app: "Endurance Calculator", subscribers: 259 },
]

export const platformUsers: PlatformUser[] = [
  {
    id: "u_1",
    name: "Jordan Diaz",
    email: "jordan@apexperformance.io",
    initials: "JD",
    plan: "Pro",
    unlockedApps: ["HRV Monitor"],
    status: "active",
    joined: "Jan 14, 2026",
  },
  {
    id: "u_2",
    name: "Mara Klein",
    email: "mara.klein@vanguard.fit",
    initials: "MK",
    plan: "Pro",
    unlockedApps: ["HRV Monitor", "Combat Tracker"],
    status: "active",
    joined: "Feb 2, 2026",
  },
  {
    id: "u_3",
    name: "Tomas Reyes",
    email: "treyes@strongbox.gym",
    initials: "TR",
    plan: "Starter",
    unlockedApps: ["Endurance Calculator"],
    status: "trialing",
    joined: "Feb 18, 2026",
  },
  {
    id: "u_4",
    name: "Aisha Bello",
    email: "aisha@perform-lab.co",
    initials: "AB",
    plan: "Pro",
    unlockedApps: ["HRV Monitor", "Combat Tracker", "Endurance Calculator"],
    status: "active",
    joined: "Mar 4, 2026",
  },
  {
    id: "u_5",
    name: "Liam O'Connor",
    email: "liam.oconnor@ridgeline.io",
    initials: "LO",
    plan: "Starter",
    unlockedApps: [],
    status: "canceled",
    joined: "Mar 22, 2026",
  },
  {
    id: "u_6",
    name: "Sofia Marchetti",
    email: "sofia@altitude-sci.com",
    initials: "SM",
    plan: "Pro",
    unlockedApps: ["Combat Tracker"],
    status: "active",
    joined: "Apr 9, 2026",
  },
  {
    id: "u_7",
    name: "Noah Yamamoto",
    email: "noah.y@kinetic.team",
    initials: "NY",
    plan: "Starter",
    unlockedApps: ["HRV Monitor"],
    status: "trialing",
    joined: "Apr 27, 2026",
  },
  {
    id: "u_8",
    name: "Priya Nair",
    email: "priya@summitsports.in",
    initials: "PN",
    plan: "Pro",
    unlockedApps: ["HRV Monitor", "Endurance Calculator"],
    status: "active",
    joined: "May 11, 2026",
  },
]
