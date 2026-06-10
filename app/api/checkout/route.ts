// TODO (Phase 1): Create a Stripe Checkout Session for the given app slug.
// Requires authenticated session (Clerk auth()).
// Looks up stripe_price_id from apps table by slug.
// Sets success_url to /checkout/success?session_id={CHECKOUT_SESSION_ID}
// Sets cancel_url to /apps
import { NextResponse } from "next/server"

export async function POST() {
  // TODO: const { slug } = await req.json()
  // TODO: const { userId } = await auth() — redirect to /login if null
  // TODO: look up stripe_price_id from DB
  // TODO: create Stripe Checkout Session
  // TODO: return { url: session.url }
  return NextResponse.json({ message: "TODO" }, { status: 501 })
}
