// TODO (Phase 4): DELETE — revoke coach-athlete relationship (set status = 'revoked').
// Requires authenticated session + role === 'coach' + owns this relationship.
import { NextResponse } from "next/server"

export async function DELETE() {
  return NextResponse.json({ message: "TODO" }, { status: 501 })
}
