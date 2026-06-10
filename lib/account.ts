import { apps, monthlyTotal, type HubApp } from "@/lib/apps"

export interface Account {
  name: string
  email: string
  initials: string
  role: string
  plan: string
  nextBilling: string
  paymentBrand: string
  paymentLast4: string
}

export const account: Account = {
  name: "Jordan Diaz",
  email: "jordan@apexperformance.io",
  initials: "JD",
  role: "Performance Coach",
  plan: "Pro",
  nextBilling: "Jul 1, 2026",
  paymentBrand: "Visa",
  paymentLast4: "4242",
}

export type SubscriptionStatus = "active" | "past_due" | "canceled"

export interface Subscription {
  app: HubApp
  status: SubscriptionStatus
  nextBilling: string
}

export const subscriptions: Subscription[] = apps
  .filter((a) => a.state === "unlocked")
  .map((app) => ({
    app,
    status: "active" as const,
    nextBilling: account.nextBilling,
  }))

export function accountMonthlyTotal(): number {
  return monthlyTotal()
}
