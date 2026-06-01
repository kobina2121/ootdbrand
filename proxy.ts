import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { getAuthSecret, getSessionTokenCookieName } from "@/lib/auth/session-config";

function applySecurityHeaders(response: NextResponse, isHttps: boolean) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  if (isHttps) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isHttps = request.nextUrl.protocol === "https:";

  if (!pathname.startsWith("/admin")) {
    return applySecurityHeaders(NextResponse.next(), isHttps);
  }

  const token = await getToken({
    req: request,
    secret: getAuthSecret(),
    cookieName: getSessionTokenCookieName(),
  });

  if (!token || token.role !== "admin") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl), isHttps);
  }

  return applySecurityHeaders(NextResponse.next(), isHttps);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
