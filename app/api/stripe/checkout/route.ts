import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

import { db } from "@/lib/db"
import { stripeCheckoutConfigError } from "@/lib/stripe-prices"
import { getAppUrl, getStripe } from "@/lib/stripe"

export async function POST(request: Request) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { appSlug?: string; slug?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const appSlug = (body.appSlug ?? body.slug)?.trim()
  if (!appSlug) {
    return NextResponse.json({ error: "appSlug is required" }, { status: 400 })
  }

  const user = await db.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true, email: true },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const app = await db.app.findFirst({
    where: { slug: appSlug, active: true },
    select: { slug: true, stripePriceId: true, name: true },
  })

  if (!app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 })
  }

  const configError = stripeCheckoutConfigError(app.stripePriceId)
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 })
  }

  try {
    const stripe = getStripe()
    const appUrl = getAppUrl()

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [{ price: app.stripePriceId, quantity: 1 }],
      success_url: `${appUrl}/apps?checkout=success`,
      cancel_url: `${appUrl}/apps?checkout=canceled`,
      metadata: {
        userId: user.id,
        appSlug: app.slug,
        clerkUserId,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          appSlug: app.slug,
          clerkUserId,
        },
      },
    })

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 },
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
