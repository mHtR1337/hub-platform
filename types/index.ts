// Shared TypeScript types used across the platform and sub-apps.
// Sub-app-specific types should live in sub-apps/<slug>/ instead.

export type UserRole = "athlete" | "coach" | "admin"

export type EntitlementStatus = "active" | "trialing" | "past_due" | "canceled" | "unpaid"

export type CoachAthleteStatus = "pending" | "active" | "revoked"

export interface PlatformUser {
  id: string
  clerkId: string
  email: string
  role: UserRole
  createdAt: Date
}

export interface Entitlement {
  id: string
  userId: string
  appSlug: string
  status: EntitlementStatus
  stripeSubscriptionId: string
  stripeCustomerId: string
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  createdAt: Date
  updatedAt: Date
}
