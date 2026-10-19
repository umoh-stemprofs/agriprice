import { Crop, type PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  FarmNotFoundError,
  costForUser,
  listCostsForUser,
  saveCostForUser,
  type CostRow,
} from "./service";

/**
 * Ownership of the costs form (step 4B): a farmer can neither read nor save
 * another farmer's CostSetting rows. The fake Prisma implements exactly the
 * filters these functions use — `farm: { userId }` for reads and a farm
 * resolved from the user id for the save — so the scope is what is tested,
 * offline.
 */

const USER_A = "usr_a";
const USER_B = "usr_b";
const FARM_A = "farm_a";
const FARM_B = "farm_b";

const FARMS = [
  { id: FARM_A, userId: USER_A, createdAt: new Date("2026-10-01T08:00:00.000Z") },
  { id: FARM_B, userId: USER_B, createdAt: new Date("2026-10-02T08:00:00.000Z") },
];

function makeRows(): CostRow[] {
  return [
    {
      id: "cost_a_maize",
      farmId: FARM_A,
      crop: Crop.MAIZE,
      storageKoboPerKgPerWeek: 200,
      spoilagePctPerWeek: 1,
      minGainPct: 2,
    },
    {
      id: "cost_a_yam",
      farmId: FARM_A,
      crop: Crop.YAM,
      storageKoboPerKgPerWeek: 100,
      spoilagePctPerWeek: 4,
      minGainPct: 2,
    },
    {
      id: "cost_b_maize",
      farmId: FARM_B,
      crop: Crop.MAIZE,
      storageKoboPerKgPerWeek: 999,
      spoilagePctPerWeek: 9,
      minGainPct: 5,
    },
  ];
}

interface Filter {
  farm?: { userId?: string };
  crop?: Crop;
}

function fakeDb(rows: CostRow[]) {
  let nextId = 1;
  const ownerOf = (row: CostRow) => FARMS.find((farm) => farm.id === row.farmId)?.userId;

  function inScope(row: CostRow, where: Filter): boolean {
    const userId = where.farm?.userId;
    if (userId !== undefined && ownerOf(row) !== userId) return false;
    if (where.crop !== undefined && row.crop !== where.crop) return false;
    return true;
  }

  return {
    farm: {
      async findFirst({ where }: { where: { userId: string } }) {
        return FARMS.find((farm) => farm.userId === where.userId) ?? null;
      },
    },
    costSetting: {
      async findMany({ where }: { where: Filter }) {
        return rows.filter((row) => inScope(row, where));
      },
      async findFirst({ where }: { where: Filter }) {
        return rows.find((row) => inScope(row, where)) ?? null;
      },
      async upsert({
        where,
        update,
        create,
      }: {
        where: { farmId_crop: { farmId: string; crop: Crop } };
        update: Omit<CostRow, "id" | "farmId" | "crop">;
        create: Omit<CostRow, "id">;
      }) {
        const { farmId, crop } = where.farmId_crop;
        const existing = rows.find((row) => row.farmId === farmId && row.crop === crop);
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const created: CostRow = { id: `cost_new_${nextId++}`, ...create };
        rows.push(created);
        return created;
      },
    },
  } as unknown as PrismaClient;
}

describe("cost settings ownership", () => {
  it("lists only the signed-in farmer's cost rows", async () => {
    const db = fakeDb(makeRows());

    const rowsA = await listCostsForUser(db, USER_A);
    const rowsB = await listCostsForUser(db, USER_B);

    expect(rowsA.map((row) => row.id)).toEqual(["cost_a_maize", "cost_a_yam"]);
    expect(rowsB.map((row) => row.id)).toEqual(["cost_b_maize"]);
  });

  it("reads null for a crop whose settings belong to another farm", async () => {
    const db = fakeDb(makeRows());

    // Farmer B has no yam row anywhere; the only one is farmer A's.
    expect(await costForUser(db, USER_B, Crop.YAM)).toBeNull();
    expect(await costForUser(db, USER_A, Crop.YAM)).toMatchObject({
      id: "cost_a_yam",
      storageKoboPerKgPerWeek: 100,
    });
  });

  it("saves onto the caller's own farm and leaves the other farmer alone", async () => {
    const rows = makeRows();
    const db = fakeDb(rows);

    await saveCostForUser(db, USER_B, {
      crop: Crop.YAM,
      storageKoboPerKgPerWeek: 555,
      spoilagePctPerWeek: 3,
      minGainPct: 1,
    });

    const saved = rows.find((row) => row.farmId === FARM_B && row.crop === Crop.YAM);
    expect(saved).toMatchObject({ storageKoboPerKgPerWeek: 555, spoilagePctPerWeek: 3 });

    // Farmer A's yam row is untouched: the write went to farmer B's farm.
    expect(await costForUser(db, USER_A, Crop.YAM)).toMatchObject({
      id: "cost_a_yam",
      storageKoboPerKgPerWeek: 100,
    });
  });

  it("updates the same crop in place instead of adding a second row", async () => {
    const rows = makeRows();
    const db = fakeDb(rows);

    await saveCostForUser(db, USER_A, {
      crop: Crop.MAIZE,
      storageKoboPerKgPerWeek: 700,
      spoilagePctPerWeek: 0,
      minGainPct: 4,
    });

    expect(rows).toHaveLength(3);
    expect(await costForUser(db, USER_A, Crop.MAIZE)).toMatchObject({
      id: "cost_a_maize",
      storageKoboPerKgPerWeek: 700,
      spoilagePctPerWeek: 0,
      minGainPct: 4,
    });
    // The other farmer's row for the same crop keeps its own numbers.
    expect(await costForUser(db, USER_B, Crop.MAIZE)).toMatchObject({
      storageKoboPerKgPerWeek: 999,
    });
  });

  it("refuses to save for a user with no farm", async () => {
    const rows = makeRows();
    const db = fakeDb(rows);

    await expect(
      saveCostForUser(db, "usr_nobody", {
        crop: Crop.MAIZE,
        storageKoboPerKgPerWeek: 100,
        spoilagePctPerWeek: 1,
        minGainPct: 2,
      }),
    ).rejects.toBeInstanceOf(FarmNotFoundError);

    expect(rows).toHaveLength(3);
  });
});
