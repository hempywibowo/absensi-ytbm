import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/admin((?!/login).*)",
  "/api/admin(.*)",
  "/api/schools(.*)",
  "/api/photo(.*)",
  "/api/leave-request/:id/review",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js|jpe?g|png|svg|ico|webp)).*)",
    "/(api|trpc)(.*)",
  ],
};
