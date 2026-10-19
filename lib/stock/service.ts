import type { Crop, PrismaClient } from "@prisma/client";

/**
 * Stock data access, always scoped to the signed-in farmer
 * (docs/00-global.md §3: "a farmer sees only their farm").
 *
 * The scope is part of the query, not a check after the fact: a row belonging
 * to another farm is simply not found. Actions call these functions with the
 * user id from the session, never with an id from the form.
 */

export interface StockRow {
  id: string;
  farmId: string;
  crop: Crop;
  qtyKg: number;
  note: string | null;
  createdAt: Date;
}

export class StockNotFoundError extends Error {
  constructor() {
    super("That stock item is not on your farm.");
    this.name = "StockNotFoundError";
  }
}

/** The relation filter every stock query carries. */
export function stockScope(userId: string) {
  return { farm: { userId } } as const;
}

export async function listStock(db: PrismaClient, userId: string): Promise<StockRow[]> {
  return db.inventoryItem.findMany({
    where: stockScope(userId),
    orderBy: [{ crop: "asc" }, { createdAt: "asc" }],
  });
}

export async function updateStockForUser(
  db: PrismaClient,
  userId: string,
  id: string,
  data: { qtyKg: number; note: string | null },
): Promise<StockRow> {
  const found = await db.inventoryItem.findFirst({
    where: { id, ...stockScope(userId) },
  });
  if (!found) throw new StockNotFoundError();

  return db.inventoryItem.update({ where: { id: found.id }, data });
}

export async function deleteStockForUser(
  db: PrismaClient,
  userId: string,
  id: string,
): Promise<StockRow> {
  const found = await db.inventoryItem.findFirst({
    where: { id, ...stockScope(userId) },
  });
  if (!found) throw new StockNotFoundError();

  return db.inventoryItem.delete({ where: { id: found.id } });
}
