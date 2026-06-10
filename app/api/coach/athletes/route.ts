// TODO (Phase 4): Coach athlete roster management.
// GET  — list this coach's athletes (status = active)
// POST — invite an athlete by email (creates pending row, sends Resend email)
// Both require authenticated session + role === 'coach'.
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ athletes: [] })
}

export async function POST() {
  return NextResponse.json({ message: "TODO" }, { status: 501 })
}
