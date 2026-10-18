import { Crop } from "@prisma/client";
import { WEATHER } from "@/lib/config";
import type { DailyWeather } from "./types";

/**
 * Harvest alert (docs/01-agriprice.md, rule 9).
 * 20 mm or more of rain in the next 3 days, for maize and rice paddy only.
 * This alert never changes the sell/hold badge — it is shown separately.
 *
 * The 20 mm / 3 day / crop list come from WEATHER.thresholds in /lib/config.ts
 * and are SAMPLE numbers until an expert reviews them.
 */

/** Crops this alert can apply to. */
export const HARVEST_CROPS: readonly Crop[] = [Crop.MAIZE, Crop.RICE_PADDY];

export interface HarvestAlert {
  /** Total rain over the window, mm, rounded to 1 decimal. */
  rainMm: number;
  /** Length of the window in days. */
  days: number;
  /** Which of the farm's crops are affected. */
  crops: Crop[];
  message: string;
}

/** Total forecast rain over the first `days` days of the forecast, in mm. */
export function rainTotalNextDays(
  daily: readonly DailyWeather[],
  days: number = WEATHER.thresholds.heavyRainDays,
): number {
  let total = 0;
  for (let i = 0; i < Math.min(days, daily.length); i++) {
    const mm = daily[i]?.rainMm ?? 0;
    if (Number.isFinite(mm) && mm > 0) total += mm;
  }
  return Math.round(total * 10) / 10;
}

/**
 * Returns the alert when the forecast has heavy rain inside the window AND
 * the farm holds one of the affected crops; otherwise null.
 */
export function harvestAlert(
  daily: readonly DailyWeather[],
  farmCrops: readonly Crop[],
): HarvestAlert | null {
  const affected = HARVEST_CROPS.filter((crop) => farmCrops.includes(crop));
  if (affected.length === 0) return null;

  const rainMm = rainTotalNextDays(daily);
  if (rainMm < WEATHER.thresholds.heavyRainMm) return null;

  return {
    rainMm,
    days: WEATHER.thresholds.heavyRainDays,
    crops: affected,
    message: "Heavy rain coming. Harvest or cover the crop early.",
  };
}
