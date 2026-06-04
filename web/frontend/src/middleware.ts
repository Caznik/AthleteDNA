import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/session-constants";

// Routing-level auth gate. This only checks for the *presence* of the session
// cookie to decide where to send the browser; the backend still verifies the
// JWT signature on every API call, so a forged cookie buys nothing.
const AUTH_PAGES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (!hasSession && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Run on everything except API routes, Next internals, and static assets. The
// /api/auth/* handlers must stay reachable without a session, and other /api/*
// handlers do their own 401 handling.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
