import { Gauge } from "lucide-react"

import { config as env } from "@/lib/config"

export const config = {
  slug: "endurance-calculator",
  name: "Endurance Calculator",
  description: "FTP, training zones, and critical power.",
  icon: Gauge,
  priceCents: 700,
  stripePriceId: env.stripe.prices.enduranceCalc ?? "",
} as const
