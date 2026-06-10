import { Swords } from "lucide-react"

export const config = {
  slug: "combat-tracker",
  name: "Combat Tracker",
  description: "Training load management and ACWR for fight prep.",
  icon: Swords,
  priceCents: 1200,
  stripePriceId: process.env.STRIPE_PRICE_COMBAT_TRACKER ?? "",
} as const
