import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "mw_session";

export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/transfer/:path*"],
};
