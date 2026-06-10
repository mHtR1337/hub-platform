// TODO (Phase 1): Return all active entitlement slugs for the authenticated user.
// Used by client to optimistically show unlocked state without a full page reload.
import { NextResponse } from "next/server"

export async function GET() {
  // TODO: const { userId } = await auth()
  // TODO: const entitlements = await db.entitlement.findMany({ where: { user: { clerkId: userId }, status: { in: ['active', 'trialing'] } } })
  // TODO: return { slugs: entitlements.map(e => e.appSlug) }
  return NextResponse.json({ slugs: [] })
}
