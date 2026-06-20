import { Activity } from "lucide-react"

import { config as env } from "@/lib/config"

export const config = {
  slug: "hrv-monitor",
  name: "HRV Monitor",
  description: "Recovery & readiness tracking via heart rate variability.",
  icon: Activity,
  priceCents: 900,
  stripePriceId: env.stripe.prices.hrvMonitor ?? "",
} as const
