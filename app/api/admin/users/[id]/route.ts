// TODO (Phase 1): Update user role or status. Requires role === 'admin'.
import { NextResponse } from "next/server"

export async function PATCH() {
  return NextResponse.json({ message: "TODO" }, { status: 501 })
}
