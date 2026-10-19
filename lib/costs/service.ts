import type { Crop, PrismaClient } from "@prisma/client";

/**
 * Cost-of-waiting data access, always scoped to the signed-in farmer
 * (docs/00-global.md §3: a farmer sees only their farm).
 *
 * Reads filter on the farm owner directly; the save first resolves the farm
 * from the session's user id, so an id pasted into a form can never point the
 * write at somebody else's CostSetting row.
 */

export interface CostRow {
  id: string;
  farmId: string;
  crop: Crop;
  storageKoboPerKgPerWeek: number;
  spoilagePctPerWeek: number;
  minGainPct: number;
}

/** Thrown when the session's user has no farm to write to. */
export class FarmNotFoundError extends Error {
  constructor() {
    super("No farm belongs to this account. Add a farm in Settings first.");
    this.name = "FarmNotFoundError";
  }
}

export interface CostInput {
  crop: Crop;
  storageKoboPerKgPerWeek: number;
  spoilagePctPerWeek: number;
  minGainPct: number;
}

/** Every cost row on the farmer's own farms, crop order kept stable. */
export async function listCostsForUser(db: PrismaClient, userId: string): Promise<CostRow[]> {
  return db.costSetting.findMany({
    where: { farm: { userId } },
    orderBy: [{ crop: "asc" }],
  });
}

/** One crop's cost settings, or null when the farmer never set them. */
export async function costForUser(
  db: PrismaClient,
  userId: string,
  crop: Crop,
): Promise<CostRow | null> {
  return db.costSetting.findFirst({ where: { farm: { userId }, crop } });
}

/**
 * Create or update one crop's cost settings on the farmer's own farm.
 * The farm is resolved from `userId`, never from anything in the form.
 */
export async function saveCostForUser(
  db: PrismaClient,
  userId: string,
  input: CostInput,
): Promise<CostRow> {
  const farm = await db.farm.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!farm) throw new FarmNotFoundError();

  return db.costSetting.upsert({
    where: { farmId_crop: { farmId: farm.id, crop: input.crop } },
    update: {
      storageKoboPerKgPerWeek: input.storageKoboPerKgPerWeek,
      spoilagePctPerWeek: input.spoilagePctPerWeek,
      minGainPct: input.minGainPct,
    },
    create: {
      farmId: farm.id,
      crop: input.crop,
      storageKoboPerKgPerWeek: input.storageKoboPerKgPerWeek,
      spoilagePctPerWeek: input.spoilagePctPerWeek,
      minGainPct: input.minGainPct,
    },
  });
}
