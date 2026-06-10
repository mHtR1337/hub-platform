import { Gauge } from "lucide-react"

export const config = {
  slug: "endurance-calculator",
  name: "Endurance Calculator",
  description: "FTP, training zones, and critical power.",
  icon: Gauge,
  priceCents: 700,
  stripePriceId: process.env.STRIPE_PRICE_ENDURANCE_CALC ?? "",
} as const
