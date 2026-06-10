// TODO (Phase 1): Check a single entitlement for the authenticated user.
// Used by the checkout success page to poll until the webhook has fired.
import { NextResponse } from "next/server"

export async function GET() {
  // TODO: const { userId } = await auth()
  // TODO: query entitlements table for this user + slug
  // TODO: return { active: boolean, status: string | null }
  return NextResponse.json({ active: false, status: null })
}
