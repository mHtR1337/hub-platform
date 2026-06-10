// TODO (Phase 1): Create a Stripe Customer Portal session and return the URL.
// Requires authenticated session.
import { NextResponse } from "next/server"

export async function POST() {
  // TODO: const { userId } = await auth()
  // TODO: look up stripe_customer_id from entitlements table
  // TODO: const session = await stripe.billingPortal.sessions.create({ customer, return_url })
  // TODO: return { url: session.url }
  return NextResponse.json({ message: "TODO" }, { status: 501 })
}
