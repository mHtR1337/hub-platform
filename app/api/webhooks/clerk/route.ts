// TODO (Phase 0): Verify Clerk webhook signature and upsert the users row.
// Events to handle: user.created, user.updated, user.deleted
// Library: svix (Clerk uses it for webhook delivery)
// Docs: https://clerk.com/docs/integrations/webhooks
import { NextResponse } from "next/server"

export async function POST() {
  // TODO: const payload = await req.json()
  // TODO: verify svix signature with CLERK_WEBHOOK_SECRET
  // TODO: switch (payload.type) { case 'user.created': ... }
  return NextResponse.json({ message: "TODO" }, { status: 501 })
}
