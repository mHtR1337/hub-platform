// TODO (Phase 0): Replace with Clerk middleware.
// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
//
// const isPublic = createRouteMatcher(['/login(.*)', '/signup(.*)', '/api/webhooks(.*)'])
//
// export default clerkMiddleware(async (auth, req) => {
//   if (!isPublic(req)) await auth.protect()
// })
//
// export const config = {
//   matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)','/(api|trpc)(.*)'],
// }

export function middleware() {
  // stub — no-op until Clerk is installed
}

export const config = {
  matcher: [],
}
