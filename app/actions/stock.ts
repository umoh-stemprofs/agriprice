"use server";

import { revalidatePath } from "next/cache";
import { requireFarm, requireUser } from "@/lib/auth/guard";
import { firstIssue, stockSchema, stockUpdateSchema } from "@/lib/auth/validation";
import { db } from "@/lib/db";
import {
  StockNotFoundError,
  deleteStockForUser,
  updateStockForUser,
} from "@/lib/stock/service";

/**
 * Stock writes (step 4A). Each action starts from the session, then resolves
 * that farmer's farm, then validates the form. No id from a form is trusted on
 * its own: the service also filters by farm owner.
 */

export interface StockActionState {
  error?: string;
  ok?: boolean;
}

function refreshStockPages() {
  revalidatePath("/stock");
  revalidatePath("/dashboard");
}

function readStockForm(formData: FormData) {
  return stockSchema.safeParse({
    crop: formData.get("crop"),
    qtyKg: formData.get("qtyKg"),
    note: formData.get("note"),
  });
}

function readEditForm(formData: FormData) {
  return stockUpdateSchema.safeParse({
    qtyKg: formData.get("qtyKg"),
    note: formData.get("note"),
  });
}

function readId(formData: FormData): string | null {
  const id = formData.get("id");
  return typeof id === "string" && id.length > 0 ? id : null;
}

export async function addStockAction(formData: FormData): Promise<StockActionState> {
  const user = await requireUser();
  const parsed = readStockForm(formData);
  if (!parsed.success) return { error: firstIssue(parsed) };

  try {
    const farm = await requireFarm(user.id);
    const { crop, qtyKg, note } = parsed.data;

    // One row per crop: adding more of the same crop tops up the existing row.
    const existing = await db.inventoryItem.findFirst({
      where: { farmId: farm.id, crop },
      select: { id: true, qtyKg: true, note: true },
    });

    if (existing) {
      await db.inventoryItem.update({
        where: { id: existing.id },
        data: { qtyKg: existing.qtyKg + qtyKg, note: note ?? existing.note },
      });
    } else {
      await db.inventoryItem.create({
        data: { farmId: farm.id, crop, qtyKg, note },
      });
    }
  } catch (error) {
    console.error("Could not add stock:", error instanceof Error ? error.message : error);
    return { error: "We could not save that stock just now. Try again." };
  }

  refreshStockPages();
  return { ok: true };
}

export async function editStockAction(formData: FormData): Promise<StockActionState> {
  const user = await requireUser();
  const id = readId(formData);
  if (!id) return { error: "That stock item could not be found. Reload the page." };

  const parsed = readEditForm(formData);
  if (!parsed.success) return { error: firstIssue(parsed) };

  try {
    await updateStockForUser(db, user.id, id, {
      qtyKg: parsed.data.qtyKg,
      note: parsed.data.note,
    });
  } catch (error) {
    if (error instanceof StockNotFoundError) {
      return { error: "That stock item is not on your farm." };
    }
    console.error("Could not edit stock:", error instanceof Error ? error.message : error);
    return { error: "We could not save that change just now. Try again." };
  }

  refreshStockPages();
  return { ok: true };
}

export async function deleteStockAction(formData: FormData): Promise<StockActionState> {
  const user = await requireUser();
  const id = readId(formData);
  if (!id) return { error: "That stock item could not be found. Reload the page." };

  try {
    await deleteStockForUser(db, user.id, id);
  } catch (error) {
    if (error instanceof StockNotFoundError) {
      return { error: "That stock item is not on your farm." };
    }
    console.error("Could not delete stock:", error instanceof Error ? error.message : error);
    return { error: "We could not delete that stock just now. Try again." };
  }

  refreshStockPages();
  return { ok: true };
}
