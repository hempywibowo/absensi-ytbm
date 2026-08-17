import { clerkMiddleware } from "@clerk/nextjs/server";

function isProtectedRoute(pathname) {
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) return true;
  if (pathname.startsWith("/api/admin")) return true;
  if (pathname.startsWith("/api/schools")) return true;
  if (pathname.startsWith("/api/photo")) return true;
  if (/^\/api\/leave-request\/[^/]+\/review$/.test(pathname)) return true;
  return false;
}

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req.nextUrl.pathname)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js|jpe?g|png|svg|ico|webp)).*)",
    "/(api|trpc)(.*)",
  ],
};
