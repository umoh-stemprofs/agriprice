import { hashSync } from "bcryptjs";
import { verifyPassword } from "./password";

/**
 * Login check, separated from Prisma so it can be tested without a database.
 * The action passes the real client's `findByEmail`; the test passes a stub.
 */

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passHash: string;
}

export interface UserLookup {
  findByEmail(email: string): Promise<UserRecord | null>;
}

/**
 * A throwaway hash checked when the email is unknown, so a wrong email and a
 * wrong password take about the same time and cannot be told apart from the
 * response time. Built once per process.
 */
const DUMMY_HASH = hashSync("agriprice-no-such-user", 10);

/** The user when the password matches, otherwise null. Never throws for input. */
export async function authenticate(
  store: UserLookup,
  email: string,
  password: string,
): Promise<UserRecord | null> {
  const user = await store.findByEmail(email.trim().toLowerCase());
  if (!user) {
    await verifyPassword(password, DUMMY_HASH);
    return null;
  }
  const ok = await verifyPassword(password, user.passHash);
  return ok ? user : null;
}
