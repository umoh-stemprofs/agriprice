import type { SessionOptions } from "iron-session";
import { AUTH } from "@/lib/config";

/**
 * Session shape and iron-session options (docs/00-global.md §3).
 *
 * Kept free of next/headers so middleware can use the same options: the
 * option builder must be safe in the edge runtime too.
 */

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export interface SessionData {
  user?: SessionUser;
}

/**
 * Build the cookie options. Throws a plain sentence when SESSION_SECRET is
 * missing, because a session with a guessable key is worse than no login:
 * the app must not start pretending it is secure.
 */
export function sessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET?.trim();
  if (!password || password.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or shorter than 32 characters. Add a random value to .env (see .env.example).",
    );
  }

  return {
    cookieName: AUTH.cookieName,
    password,
    ttl: AUTH.maxAgeSeconds,
    cookieOptions: {
      httpOnly: true,
      // Secure cookies need https, which production has and localhost does not.
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: AUTH.maxAgeSeconds,
      path: "/",
    },
  };
}
