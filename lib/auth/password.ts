import { compare, hash } from "bcryptjs";
import { AUTH } from "@/lib/config";

/**
 * Password hashing (docs/00-global.md §3: bcrypt, cost 10).
 * Only the hash is stored; the plain password never leaves the request.
 */

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, AUTH.bcryptCost);
}

/**
 * Compare a typed password with a stored hash. A malformed hash is a wrong
 * password, not a crash: the login form must always answer with one sentence.
 */
export async function verifyPassword(plain: string, passHash: string): Promise<boolean> {
  try {
    return await compare(plain, passHash);
  } catch {
    return false;
  }
}
