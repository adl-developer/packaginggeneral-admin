import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/config";

/**
 * Route guard for the admin portal.
 *
 * ⚠ Next.js 16 renamed the `middleware` file convention to `proxy` — this file
 * must stay named `proxy.ts` and export `proxy`.
 *
 * This only checks that a session cookie EXISTS; it does not validate the JWT.
 * Real enforcement is the backend rejecting an invalid or expired bearer token,
 * which `adminFetch` surfaces as a forced sign-out. Treat this purely as a
 * redirect convenience, never as the security boundary.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!signedIn && pathname !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Preserve where they were headed so login can bounce them back.
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (signedIn && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next internals, the favicon and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png).*)"],
};
