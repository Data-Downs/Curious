import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/auth", "/api", "/gift/", "/lab"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for public routes and root
  if (
    pathname === "/" ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  // Check for Supabase auth cookie presence
  // The actual token validation happens in API routes / server components
  const hasAuthCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  if (!hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
