export type AppState = "unlocked" | "locked"

export type AppIcon = "activity" | "swords" | "gauge"

/** UI metadata keyed by app slug (not stored in the database). */
export const APP_CATALOG_META: Record<
  string,
  { icon: AppIcon; category: string }
> = {
  "hrv-monitor": { icon: "activity", category: "Recovery" },
  "combat-tracker": { icon: "swords", category: "Load" },
  "endurance-calculator": { icon: "gauge", category: "Performance" },
}

const DEFAULT_CATALOG_META = {
  icon: "activity" as AppIcon,
  category: "App",
}

export interface HubApp {
  id: string
  name: string
  description: string
  icon: AppIcon
  state: AppState
  /** Monthly price in USD. */
  price: number
  /** Short category label used in the catalog. */
  category: string
}

export const apps: HubApp[] = [
  {
    id: "hrv-monitor",
    name: "HRV Monitor",
    description: "Recovery & readiness tracking",
    icon: "activity",
    state: "unlocked",
    price: 9,
    category: "Recovery",
  },
  {
    id: "combat-tracker",
    name: "Combat Tracker",
    description: "Training load & ACWR for fight prep",
    icon: "swords",
    state: "locked",
    price: 12,
    category: "Load",
  },
  {
    id: "endurance-calculator",
    name: "Endurance Calculator",
    description: "Training zones & critical power",
    icon: "gauge",
    state: "locked",
    price: 7,
    category: "Performance",
  },
]

/** Bundle price to unlock every app. */
export const BUNDLE_PRICE = 29

export function formatPrice(value: number): string {
  return `$${value}/mo`
}

export function unlockedApps(): HubApp[] {
  return apps.filter((a) => a.state === "unlocked")
}

export function lockedApps(): HubApp[] {
  return apps.filter((a) => a.state === "locked")
}

export function catalogMetaForSlug(slug: string): {
  icon: AppIcon
  category: string
} {
  return APP_CATALOG_META[slug] ?? DEFAULT_CATALOG_META
}

/** Sum of the monthly price of all unlocked apps. */
export function monthlyTotal(): number {
  return unlockedApps().reduce((sum, a) => sum + a.price, 0)
}
