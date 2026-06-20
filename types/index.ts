// Shared TypeScript types used across the platform and sub-apps.

export type UserRole = "athlete" | "coach" | "admin"

export type OrgMemberRole = "admin" | "coach" | "staff" | "athlete"

export type TeamMemberRole = "coach" | "athlete"

export type TagCategory = "sport" | "position" | "descriptive"

export type StaffPrivilege =
  | "manage_org"
  | "manage_roster"
  | "manage_billing"
  | "manage_tags"
  | "view_all"

export type EntitlementStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"

export type CoachAthleteStatus = "pending" | "active" | "revoked"

export type PlanStatus = "active" | "trialing" | "canceled"

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

export interface SeatLimits {
  maxCoaches: number
  maxAthletes: number
  usedCoaches: number
  usedAthletes: number
}

export interface PlanTemplateInfo {
  slug: string
  name: string
  maxCoaches: number
  maxAthletes: number
}
