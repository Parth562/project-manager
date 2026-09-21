import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Fast, cookie-only check (no DB hit) — an optimistic first pass.
// The real, Postgres-backed authority is getServerSession() in app/(dashboard)/layout.tsx.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/projects",
  "/requirements",
  "/tasks",
  "/sprints",
  "/testing",
  "/bugs",
];
const AUTH_PAGES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request));

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (AUTH_PAGES.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/requirements/:path*",
    "/tasks/:path*",
    "/sprints/:path*",
    "/testing/:path*",
    "/bugs/:path*",
    "/login",
    "/register",
  ],
};
