import { getIronSession } from "iron-session";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH } from "@/lib/config";
import { sessionOptions, type SessionData } from "@/lib/auth/session-options";

/**
 * Every page except login and signup needs a session (step 4A).
 *
 * The cookie is encrypted and httpOnly; unsealing fails closed (a tampered or
 * expired cookie reads as signed out). Server actions and pages still check
 * the session themselves, so this is a fast first gate, not the only one.
 */

const PUBLIC_PAGES = new Set(["/login", "/signup"]);

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const response = NextResponse.next();

  const session = await getIronSession<SessionData>(request, response, sessionOptions());
  const signedIn = Boolean(session.user?.id);

  if (PUBLIC_PAGES.has(pathname)) {
    if (signedIn) return NextResponse.redirect(new URL("/dashboard", request.url));
    return response;
  }

  if (signedIn) return response;

  const loginUrl = new URL("/login", request.url);
  if (pathname !== "/") {
    loginUrl.searchParams.set("next", `${pathname}${search}`);
  }
  const redirect = NextResponse.redirect(loginUrl);
  // A cookie that cannot be read is cleared, so the next request starts clean.
  redirect.cookies.delete(AUTH.cookieName);
  return redirect;
}

export const config = {
  // Pages only: API routes are data feeds with no per-user information.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
