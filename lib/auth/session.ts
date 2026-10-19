import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData, type SessionUser } from "./session-options";

export type { SessionData, SessionUser } from "./session-options";

/**
 * Session access for server components, server actions and route handlers.
 * Reading the session is not a permission check by itself: actions also load
 * the farm and scope every query to that farm.
 */

export async function getSession() {
  return getIronSession<SessionData>(cookies(), sessionOptions());
}

/** The signed-in farmer, or null. */
export async function currentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user ?? null;
}

/** Store the farmer in the encrypted cookie. */
export async function signIn(user: SessionUser): Promise<void> {
  const session = await getSession();
  session.user = user;
  await session.save();
}

/** Remove the cookie. */
export async function signOut(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
