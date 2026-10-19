"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/guard";
import { FarmNotFoundError, saveCostForUser } from "@/lib/costs/service";
import { db } from "@/lib/db";
import { nairaToKobo } from "@/lib/format";
import { costSettingsSchema, firstIssue } from "@/lib/auth/validation";

/**
 * Save the cost of waiting for one crop (docs/01-agriprice.md).
 * The session decides whose farm is written; the crop and the three numbers
 * come from the form and are validated with Zod first. Naira becomes integer
 * kobo here, at the edge, and nowhere else.
 */

export interface CostActionState {
  error?: string;
  ok?: boolean;
  message?: string;
}

export async function saveCropCostsAction(formData: FormData): Promise<CostActionState> {
  const user = await requireUser();

  const parsed = costSettingsSchema.safeParse({
    crop: formData.get("crop"),
    storageNaira: formData.get("storageNaira"),
    spoilagePctPerWeek: formData.get("spoilagePctPerWeek"),
    minGainPct: formData.get("minGainPct"),
  });
  if (!parsed.success) return { error: firstIssue(parsed) };

  try {
    await saveCostForUser(db, user.id, {
      crop: parsed.data.crop,
      storageKoboPerKgPerWeek: nairaToKobo(parsed.data.storageNaira),
      spoilagePctPerWeek: parsed.data.spoilagePctPerWeek,
      minGainPct: parsed.data.minGainPct,
    });
  } catch (error) {
    if (error instanceof FarmNotFoundError) return { error: error.message };
    console.error("Could not save costs:", error instanceof Error ? error.message : error);
    return { error: "We could not save those costs just now. Try again." };
  }

  revalidatePath("/costs");
  revalidatePath("/dashboard");
  revalidatePath(`/crop/${parsed.data.crop}`);
  return { ok: true, message: "Costs saved." };
}
