import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "token";
const PUBLIC_PATHS = ["/login"];

/**
 * First line of defence: unauthenticated visitors never see a portal page.
 * This only checks that the session cookie EXISTS. The Express API verifies
 * the JWT on every request, so a forged cookie still gets 401s from the API.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(AUTH_COOKIE);
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!hasSession && !isPublic) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip /api (rewritten to Express), Next internals and files with extensions
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
