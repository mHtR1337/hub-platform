// TODO (Phase 1): Handle Stripe subscription lifecycle events.
// Events to handle:
//   checkout.session.completed  → INSERT entitlements
//   customer.subscription.updated → UPDATE entitlements status
//   customer.subscription.deleted → UPDATE entitlements status = 'canceled'
//   invoice.payment_failed       → UPDATE entitlements status = 'past_due'
// Always verify stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET).
// Always check subscription_events for duplicate stripe_event_id before processing.
import { NextResponse } from "next/server"

export async function POST() {
  // TODO: const body = await req.text()
  // TODO: const sig = req.headers.get('stripe-signature')
  // TODO: const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  return NextResponse.json({ message: "TODO" }, { status: 501 })
}
