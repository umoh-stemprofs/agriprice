import { redirect } from "next/navigation";
import { db, withDbRetry } from "@/lib/db";
import { DEFAULT_FARM, NEW_FARM_NAME } from "@/lib/config";
import { currentUser, type SessionUser } from "./session";

/**
 * The session re-check used by every page and every server action
 * (docs/00-global.md §3). Middleware is a convenience, never the only guard.
 */

export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * The farmer's farm. A freshly signed-up farmer has one; if the row is gone
 * (for example a half-finished seed) one is created rather than showing an
 * empty page forever.
 */
export async function requireFarm(userId: string) {
  // withDbRetry: a slow or resetting connection is retried once (lib/db.ts),
  // so one stalled pool connection cannot 500 a whole page.
  const farm = await withDbRetry(() =>
    db.farm.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
  );
  if (farm) return farm;

  return withDbRetry(() =>
    db.farm.create({
      data: {
        userId,
        name: NEW_FARM_NAME,
        lat: DEFAULT_FARM.lat,
        lon: DEFAULT_FARM.lon,
      },
    }),
  );
}
