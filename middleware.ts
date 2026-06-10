import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/invite(.*)",
  "/api/webhooks(.*)",
  "/api/stripe/webhook",
])

const isAuthPage = createRouteMatcher(["/login(.*)", "/signup(.*)"])

function redirectTo(path: string, req: NextRequest) {
  return NextResponse.redirect(new URL(path, req.nextUrl.origin))
}

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  if (userId && isAuthPage(req)) {
    return redirectTo("/dashboard", req)
  }

  if (!isPublicRoute(req) && !userId) {
    return redirectTo("/login", req)
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
