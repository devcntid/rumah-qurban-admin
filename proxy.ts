import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

const COOKIE_NAME = "rq_admin_session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/targets",
  "/pos",
  "/orders",
  "/transactions",
  "/farm",
  "/logistics",
  "/pricing",
  "/master",
  "/logs",
];

export function proxy(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl;

  const isLogin = pathname === "/login";
  const isApp =
    pathname === "/" ||
    PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const hasSession = Boolean(req.cookies.get(COOKIE_NAME)?.value);

  if (isLogin && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (isApp && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname === "/" && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard",
    "/dashboard/:path*",
    "/targets/:path*",
    "/pos/:path*",
    "/orders/:path*",
    "/transactions/:path*",
    "/farm/:path*",
    "/logistics/:path*",
    "/pricing/:path*",
    "/master/:path*",
    "/logs/:path*",
  ],
};

