import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Protected routes (require login)
const protectedRoutes = ["/portal"];
// Public routes (cannot be accessed when logged in)
const publicRoutes = ["/login"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const localePathMatch = path.match(/^\/(en|ar)(\/.*)?$/);
  const locale = localePathMatch ? localePathMatch[1] : null;
  const appPath = localePathMatch && localePathMatch[2] ? localePathMatch[2] : (localePathMatch ? "/" : path);

  // Exclude API, Next.js internal, and static assets
  if (appPath.startsWith("/_next") || appPath.startsWith("/api") || appPath.includes(".")) {
    return NextResponse.next();
  }

  const isProtectedRoute = protectedRoutes.some((route) => appPath.startsWith(route));
  const isPublicRoute = publicRoutes.includes(appPath);

  const token = request.cookies.get("session")?.value;
  const session = token ? await verifyToken(token) : null;

  // 1. If trying to access protected route without session -> redirect to login
  if (isProtectedRoute && !session) {
    const loginUrl = new URL(`/${locale || routing.defaultLocale}/login`, request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If trying to access public route (like login) WITH active session -> redirect to portal
  if (isPublicRoute && session) {
    const redirectPath = "/portal";
    return NextResponse.redirect(new URL(`/${locale || routing.defaultLocale}${redirectPath}`, request.nextUrl));
  }

  // 3. For protected routes, pass user context headers
  if (isProtectedRoute && session) {
    const response = intlMiddleware(request);
    response.headers.set("x-user-id", session.userId.toString());
    response.headers.set("x-user-role", session.role);
    return response;
  }

  // 4. Fallback to normal intl-middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
