import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("hipa_token");
  const { pathname } = request.nextUrl;

  const protectedRoutes = [
    "/dashboard",
    "/orders",
    "/profile",
    "/wallet",
    "/products",
    "/crm",
    "/analytics",
    "/ads",
    "/finance",
    "/settings",
  ];

  const adminRoutes = ["/admin"];

  // Protect standard routes - require authentication
  if (protectedRoutes.some((r) => pathname.startsWith(r)) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protect admin routes - require authentication (role check happens at API level)
  if (adminRoutes.some((r) => pathname.startsWith(r)) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
