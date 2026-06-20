import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

import { createCheckoutSession } from "@/lib/payments"
import { db } from "@/lib/db"
import { stripeCheckoutConfigError } from "@/lib/stripe-prices"

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
    const session = await createCheckoutSession({
      userId: user.id,
      email: user.email,
      clerkUserId,
      appSlug: app.slug,
      stripePriceId: app.stripePriceId,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
