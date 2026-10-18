import { z } from "zod";
import { Crop, PriceSource, Unit } from "@prisma/client";

/**
 * Validation for anything that crosses a network boundary.
 * The rules say Zod on every server input, and the adapters must "reject
 * anything unexpected", so nothing is trusted — not even a shape we built.
 */

export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a date as YYYY-MM-DD.");

/** One row of the market feed: {crop, date, priceKobo, unit, source}. */
export const priceTickSchema = z.object({
  crop: z.nativeEnum(Crop),
  date: dateOnlySchema,
  priceKobo: z.number().int().positive("Price must be a positive number of kobo."),
  unit: z.nativeEnum(Unit),
  source: z.nativeEnum(PriceSource),
});

export const priceListSchema = z.array(priceTickSchema);

/** Query string for GET /api/market/history. */
export const historyQuerySchema = z.object({
  crop: z.nativeEnum(Crop),
  days: z.coerce.number().int().min(1).max(90),
});

export type PriceTickInput = z.infer<typeof priceTickSchema>;
