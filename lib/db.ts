import { PrismaClient } from "@prisma/client";

// One client per process. In dev, Next.js re-evaluates modules on every edit,
// so keep the instance on globalThis to avoid exhausting database connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

/**
 * A slow or resetting database connection is transient: the pool times out
 * (P2024) or the remote host closes a socket. Those clear on a second try;
 * anything else (a bad query, a constraint) is a real bug and must surface.
 * Found in the click-through: one reset connection stalled the pool, the
 * weather page got a raw 500 instead of the page.
 */
export function isTransientDbError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: string }).code;
  if (code === "P2024") return true; // "Timed out fetching a new connection from the connection pool"
  return /connection pool|ConnectionReset|forcibly closed|ECONNRESET|Connection refused/i.test(
    error.message,
  );
}

/** Runs `run` again once, and only for transient connection failures. */
export async function withDbRetry<T>(
  run: () => Promise<T>,
  attempts = 2,
  delayMs = 750,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (!isTransientDbError(error) || attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw lastError;
}
