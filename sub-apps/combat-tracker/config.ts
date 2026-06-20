import { Swords } from "lucide-react"

import { config as env } from "@/lib/config"

export const config = {
  slug: "combat-tracker",
  name: "Combat Tracker",
  description: "Training load management and ACWR for fight prep.",
  icon: Swords,
  priceCents: 1200,
  stripePriceId: env.stripe.prices.combatTracker ?? "",
} as const
