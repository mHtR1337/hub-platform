// Copy this file to sub-apps/<your-slug>/config.ts and fill in the values.
// See docs/CONTRIBUTING.md for the full step-by-step guide.
import { Activity } from "lucide-react"

export const config = {
  slug: "your-slug",               // must match folder name and apps.slug in DB
  name: "Your App Name",
  description: "One sentence describing what this app does.",
  icon: Activity,                  // any Lucide icon
  priceCents: 900,                 // e.g. 900 = $9.00/mo
  stripePriceId: "price_...",      // from Stripe dashboard
} as const
