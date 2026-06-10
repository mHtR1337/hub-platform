// TODO (Phase 1): Return live platform KPIs. Requires role === 'admin'.
// MRR, active subscriptions, total users, most popular app.
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ message: "TODO" }, { status: 501 })
}
