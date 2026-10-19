"use server";

import { revalidatePath } from "next/cache";
import { requireFarm, requireUser } from "@/lib/auth/guard";
import { farmSettingsSchema, firstIssue } from "@/lib/auth/validation";
import { db } from "@/lib/db";

/**
 * Farm settings (step 4A): name, latitude, longitude.
 * The update is filtered by both the farm id and the signed-in user id, so a
 * made-up farm id in the form cannot rename someone else's farm.
 */

export interface FarmActionState {
  error?: string;
  ok?: boolean;
  message?: string;
}

export async function saveFarmAction(formData: FormData): Promise<FarmActionState> {
  const user = await requireUser();

  const parsed = farmSettingsSchema.safeParse({
    name: formData.get("name"),
    lat: formData.get("lat"),
    lon: formData.get("lon"),
  });
  if (!parsed.success) return { error: firstIssue(parsed) };

  try {
    const farm = await requireFarm(user.id);
    const { count } = await db.farm.updateMany({
      where: { id: farm.id, userId: user.id },
      data: parsed.data,
    });
    if (count === 0) return { error: "That farm is not on your account." };

    // The coordinates changed, so weather saved for the old place is no longer
    // the truth for this farm. The next visit fetches a fresh forecast.
    await db.weatherSnapshot.deleteMany({ where: { farmId: farm.id } });
  } catch (error) {
    console.error("Could not save farm:", error instanceof Error ? error.message : error);
    return { error: "We could not save the farm just now. Try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/weather");
  return { ok: true, message: "Farm saved." };
}
