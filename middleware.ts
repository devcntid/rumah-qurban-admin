import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "rq_admin_session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/targets",
  "/pos",
  "/orders",
  "/finance",
  "/farm",
  "/logistics",
  "/pricing",
  "/master",
  "/logs",
];

export function middleware(req: NextRequest) {
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
    "/dashboard/:path*",
    "/targets/:path*",
    "/pos/:path*",
    "/orders/:path*",
    "/finance/:path*",
    "/farm/:path*",
    "/logistics/:path*",
    "/pricing/:path*",
    "/master/:path*",
    "/logs/:path*",
  ],
};

