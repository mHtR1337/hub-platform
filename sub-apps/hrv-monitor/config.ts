import { Activity } from "lucide-react"

export const config = {
  slug: "hrv-monitor",
  name: "HRV Monitor",
  description: "Recovery & readiness tracking via heart rate variability.",
  icon: Activity,
  priceCents: 900,
  stripePriceId: process.env.STRIPE_PRICE_HRV_MONITOR ?? "", // set in .env.local
} as const
