import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/targets",
  "/pos",
  "/orders",
  "/customers",
  "/transactions",
  "/farm",
  "/slaughter",
  "/logistics",
  "/pricing",
  "/master",
  "/logs",
  "/faqs",
  "/users",
  "/notif-templates",
  "/broadcast",
];

export async function proxy(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl;

  const isLogin = pathname === "/login";
  const isApp =
    pathname === "/" ||
    PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isApi = pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/");

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const hasSession = !!token;

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

  if (isApi && !hasSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    "/customers/:path*",
    "/transactions/:path*",
    "/farm/:path*",
    "/slaughter/:path*",
    "/logistics/:path*",
    "/pricing/:path*",
    "/master/:path*",
    "/logs/:path*",
    "/faqs/:path*",
    "/users/:path*",
    "/notif-templates/:path*",
    "/broadcast/:path*",
    "/api/orders/:path*",
    "/api/slaughter-records/:path*",
    "/api/notif-templates/:path*",
    "/api/notifications/:path*",
    "/api/certificates/:path*",
    "/api/admin-users/:path*",
    "/api/faqs/:path*",
  ],
};
