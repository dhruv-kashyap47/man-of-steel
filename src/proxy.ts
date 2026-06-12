import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://api.openai.com https://openrouter.ai",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/favicon.ico" || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  if (!response.headers.has("Content-Security-Policy")) {
    response.headers.set("Content-Security-Policy", CSP_HEADER);
  }

  if (pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
