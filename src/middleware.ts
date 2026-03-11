import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin routes → skip i18n, let pages handle their own auth
  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // API routes → skip
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Public routes → apply i18n
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/",
    "/(fr|en|tr)/:path*",
    "/((?!api|_next|uploads|.*\\..*).*)",
  ],
};
