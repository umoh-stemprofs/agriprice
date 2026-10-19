import { Crop, type PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  StockNotFoundError,
  deleteStockForUser,
  listStock,
  stockScope,
  updateStockForUser,
  type StockRow,
} from "./service";

/**
 * Ownership, the security rule from docs/00-global.md §3: "a farmer sees only
 * their farm". Prisma is replaced by a small fake that understands the two
 * filters these functions use — `id` and the `farm: { userId }` relation — so
 * the test runs offline and still proves the scope is in the query.
 */

const USER_A = "usr_a";
const USER_B = "usr_b";
const FARM_A = "farm_a";
const FARM_B = "farm_b";

const OWNER: Record<string, string> = { [FARM_A]: USER_A, [FARM_B]: USER_B };

interface Filter {
  id?: string;
  farm?: { userId?: string };
}

function matches(where: Filter, row: StockRow): boolean {
  if (where.id !== undefined && row.id !== where.id) return false;
  const userId = where.farm?.userId;
  if (userId !== undefined && OWNER[row.farmId] !== userId) return false;
  return true;
}

function makeRows(): StockRow[] {
  return [
    {
      id: "inv_a1",
      farmId: FARM_A,
      crop: Crop.MAIZE,
      qtyKg: 1200,
      note: "Dried, in bags",
      createdAt: new Date("2026-10-01T08:00:00.000Z"),
    },
    {
      id: "inv_b1",
      farmId: FARM_B,
      crop: Crop.YAM,
      qtyKg: 500,
      note: null,
      createdAt: new Date("2026-10-02T08:00:00.000Z"),
    },
  ];
}

function fakeDb(rows: StockRow[]) {
  return {
    inventoryItem: {
      async findMany({ where }: { where: Filter }) {
        return rows.filter((row) => matches(where, row));
      },
      async findFirst({ where }: { where: Filter }) {
        return rows.find((row) => matches(where, row)) ?? null;
      },
      async update({ where, data }: { where: { id: string }; data: { qtyKg: number; note: string | null } }) {
        const row = rows.find((item) => item.id === where.id);
        if (!row) throw new Error("No such row in the fake database.");
        row.qtyKg = data.qtyKg;
        row.note = data.note;
        return row;
      },
      async delete({ where }: { where: { id: string } }) {
        const index = rows.findIndex((item) => item.id === where.id);
        if (index < 0) throw new Error("No such row in the fake database.");
        return rows.splice(index, 1)[0] as StockRow;
      },
    },
  } as unknown as PrismaClient;
}

describe("stock ownership", () => {
  it("scopes every query to the signed-in farmer's farm", () => {
    expect(stockScope(USER_A)).toEqual({ farm: { userId: USER_A } });
  });

  it("lists only the signed-in farmer's stock", async () => {
    const db = fakeDb(makeRows());

    const rowsA = await listStock(db, USER_A);
    const rowsB = await listStock(db, USER_B);

    expect(rowsA.map((row) => row.id)).toEqual(["inv_a1"]);
    expect(rowsB.map((row) => row.id)).toEqual(["inv_b1"]);
  });

  it("gives an empty list when the farmer owns nothing", async () => {
    const db = fakeDb(makeRows());
    await expect(listStock(db, "usr_nobody")).resolves.toEqual([]);
  });

  it("refuses to edit another farmer's stock, and leaves it untouched", async () => {
    const rows = makeRows();
    const db = fakeDb(rows);

    await expect(
      updateStockForUser(db, USER_A, "inv_b1", { qtyKg: 999, note: "stolen" }),
    ).rejects.toBeInstanceOf(StockNotFoundError);

    expect(rows.find((row) => row.id === "inv_b1")?.qtyKg).toBe(500);
    expect(rows.find((row) => row.id === "inv_b1")?.note).toBeNull();
  });

  it("refuses to delete another farmer's stock, and leaves it in place", async () => {
    const rows = makeRows();
    const db = fakeDb(rows);

    await expect(deleteStockForUser(db, USER_A, "inv_b1")).rejects.toBeInstanceOf(
      StockNotFoundError,
    );

    expect(rows.some((row) => row.id === "inv_b1")).toBe(true);
    await expect(listStock(db, USER_B)).resolves.toHaveLength(1);
  });

  it("edits and deletes the farmer's own stock", async () => {
    const rows = makeRows();
    const db = fakeDb(rows);

    const updated = await updateStockForUser(db, USER_A, "inv_a1", { qtyKg: 800, note: null });
    expect(updated.qtyKg).toBe(800);
    expect(updated.note).toBeNull();

    const deleted = await deleteStockForUser(db, USER_A, "inv_a1");
    expect(deleted.id).toBe("inv_a1");
    await expect(listStock(db, USER_A)).resolves.toEqual([]);
  });
});
