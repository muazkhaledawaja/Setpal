import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PREFIXES = ["/coach", "/client", "/admin"];
const PUBLIC_AUTH_PATHS = ["/login", "/register", "/forgot-password"];

function stripLocale(pathname: string): string {
  for (const loc of routing.locales) {
    if (pathname === `/${loc}`) return "/";
    if (pathname.startsWith(`/${loc}/`)) return pathname.slice(loc.length + 1);
  }
  return pathname;
}

function getLocale(pathname: string): string {
  for (const loc of routing.locales) {
    if (pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)) return loc;
  }
  return routing.defaultLocale;
}

export async function proxy(request: NextRequest) {
  // 1. Run intl middleware first. If it returns a redirect (e.g. "/" → "/ar"),
  //    short-circuit and return it immediately.
  const intlResponse = intlMiddleware(request);
  if (intlResponse.headers.get("location")) {
    return intlResponse;
  }

  // 2. Refresh Supabase session and get user
  const { response: sessionResponse, user } = await updateSession(request);

  // 3. Propagate any intl-added cookies (rare, but covers locale switches)
  intlResponse.cookies.getAll().forEach((c) => {
    sessionResponse.cookies.set(c.name, c.value);
  });

  // 4. Auth gating
  const pathname = request.nextUrl.pathname;
  const stripped = stripLocale(pathname);
  const locale = getLocale(pathname);

  const isProtected = PROTECTED_PREFIXES.some((p) => stripped.startsWith(p));
  const isAuthPage = PUBLIC_AUTH_PATHS.includes(stripped);

  if (isProtected && !user) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return sessionResponse;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|landing|.*\\..*).*)"],
};
