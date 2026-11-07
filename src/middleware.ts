import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const protectedPages = [
  "/admin",
  "/create",
  "/jobs",
  "/settings",
  "/account",
  "/notifications",
  "/docs/swagger",
  "/docs/api",
];

const protectedApiPrefixes = [
  "/api/admin",
  "/api/jobs",
  "/api/notifications",
  "/api/openapi",
];

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paypal.com https://www.sandbox.paypal.com https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://unpkg.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://unpkg.com",
      "connect-src 'self' https://api-m.sandbox.paypal.com https://api-m.paypal.com https://www.paypal.com https://www.sandbox.paypal.com https://api.meta.ai https://unpkg.com",
      "frame-src https://www.paypal.com https://www.sandbox.paypal.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  );
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Convenience redirects for common doc URLs
  if (pathname === "/swagger" || pathname === "/api-docs") {
    return withSecurityHeaders(
      NextResponse.redirect(new URL("/docs/swagger", request.url)),
    );
  }

  const isProtectedPage = protectedPages.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const isProtectedApi = protectedApiPrefixes.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isProtectedPage || isProtectedApi) {
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
      if (isProtectedApi) {
        return withSecurityHeaders(
          NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        );
      }
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return withSecurityHeaders(NextResponse.redirect(login));
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/create/:path*",
    "/jobs/:path*",
    "/settings/:path*",
    "/account/:path*",
    "/notifications/:path*",
    "/docs/swagger",
    "/docs/swagger/:path*",
    "/docs/api",
    "/docs/api/:path*",
    "/swagger",
    "/api-docs",
    "/api/admin/:path*",
    "/api/jobs/:path*",
    "/api/notifications/:path*",
    "/api/openapi",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
