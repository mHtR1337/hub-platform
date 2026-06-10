import { NextResponse } from "next/server"
import type Stripe from "stripe"

import { db } from "@/lib/db"
import { getStripe } from "@/lib/stripe"

export const runtime = "nodejs"

function mapStripeStatus(
  status: Stripe.Subscription.Status,
): string {
  switch (status) {
    case "active":
      return "active"
    case "trialing":
      return "trialing"
    case "past_due":
      return "past_due"
    case "canceled":
      return "canceled"
    case "unpaid":
      return "unpaid"
    default:
      return "canceled"
  }
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription): Date {
  return new Date(subscription.current_period_end * 1000)
}

async function isDuplicateEvent(stripeEventId: string): Promise<boolean> {
  const existing = await db.subscriptionEvent.findUnique({
    where: { stripeEventId },
    select: { id: true },
  })
  return existing !== null
}

async function recordEvent(
  event: Stripe.Event,
  userId: string,
  appSlug: string,
  eventType: string,
): Promise<void> {
  await db.subscriptionEvent.create({
    data: {
      userId,
      appSlug,
      eventType,
      stripeEventId: event.id,
      payload: event.data.object as object,
    },
  })
}

async function upsertEntitlementFromSubscription(
  subscription: Stripe.Subscription,
  fallback: { userId: string; appSlug: string },
): Promise<void> {
  const userId = subscription.metadata.userId ?? fallback.userId
  const appSlug = subscription.metadata.appSlug ?? fallback.appSlug
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id

  await db.entitlement.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      userId,
      appSlug,
      status: mapStripeStatus(subscription.status),
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      currentPeriodEnd: subscriptionPeriodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      status: mapStripeStatus(subscription.status),
      stripeCustomerId: customerId,
      currentPeriodEnd: subscriptionPeriodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  })
}

async function handleCheckoutCompleted(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const userId = session.metadata?.userId
  const appSlug = session.metadata?.appSlug

  if (!userId || !appSlug) {
    throw new Error("Checkout session missing userId or appSlug metadata")
  }

  const shouldProcess = !(await isDuplicateEvent(event.id))
  if (!shouldProcess) return

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id

  if (!subscriptionId) {
    throw new Error("Checkout session missing subscription")
  }

  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  await upsertEntitlementFromSubscription(subscription, { userId, appSlug })
  await recordEvent(event, userId, appSlug, "created")
}

async function handleSubscriptionUpdated(
  event: Stripe.Event,
  subscription: Stripe.Subscription,
): Promise<void> {
  const userId = subscription.metadata.userId
  const appSlug = subscription.metadata.appSlug

  if (!userId || !appSlug) {
    throw new Error("Subscription missing userId or appSlug metadata")
  }

  const shouldProcess = !(await isDuplicateEvent(event.id))
  if (!shouldProcess) return

  await upsertEntitlementFromSubscription(subscription, { userId, appSlug })
  await recordEvent(event, userId, appSlug, "updated")
}

async function handleSubscriptionDeleted(
  event: Stripe.Event,
  subscription: Stripe.Subscription,
): Promise<void> {
  const userId = subscription.metadata.userId
  const appSlug = subscription.metadata.appSlug

  if (!userId || !appSlug) {
    throw new Error("Subscription missing userId or appSlug metadata")
  }

  const shouldProcess = !(await isDuplicateEvent(event.id))
  if (!shouldProcess) return

  await db.entitlement.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: "canceled",
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: subscriptionPeriodEnd(subscription),
    },
  })
  await recordEvent(event, userId, appSlug, "canceled")
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    )
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const body = await request.text()
  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event,
          event.data.object as Stripe.Checkout.Session,
        )
        break
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event,
          event.data.object as Stripe.Subscription,
        )
        break
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event,
          event.data.object as Stripe.Subscription,
        )
        break
      default:
        break
    }
  } catch (error) {
    console.error("Stripe webhook handler error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    )
  }

  return NextResponse.json({ received: true })
}
