// TODO (Phase 1): Paginated user list. Requires role === 'admin'.
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ users: [], total: 0 })
}
