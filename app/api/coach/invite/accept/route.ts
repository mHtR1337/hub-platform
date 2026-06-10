// TODO (Phase 4): Accept a coach invite via signed JWT token.
// POST { token } — public endpoint (no session required).
// Validates JWT signature + expiry + single-use jti.
// Updates coach_athletes row to status = 'active', nulls invite_token.
import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ message: "TODO" }, { status: 501 })
}
