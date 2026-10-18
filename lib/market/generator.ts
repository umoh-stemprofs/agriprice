import { Crop, PriceSource, Unit } from "@prisma/client";
import { MARKET } from "@/lib/config";
import { CATALOG, catalogFor } from "./catalog";
import { daysBetween, lastNDays } from "./dates";
import { seededValue } from "./random";
import rawSalts from "./salts.json";

/**
 * Deterministic price generator (docs/00-global.md §3).
 *
 * x[0] = 0
 * x[k] = x[k-1] - 0.03 * x[k-1] + e[k],  e[k] = (rand - 0.5) * 2 * 0.025
 * rand = mulberry32(hash(crop + salt + k))()
 * x is clamped to +/-0.35
 * price = round(base * exp(x))
 *
 * The same (crop, salt, day) always gives the same price, in any process,
 * in any timezone, forever — that is what makes the feed reproducible.
 */

const MAX_DRIFT = 0.35;
const PULL = 0.03;
const NOISE = 0.025;

const salts = rawSalts as Record<string, string>;

/** Salt for a crop. Salts come from lib/market/salts.json (see scripts/pick-salts.ts). */
export function saltFor(crop: Crop): string {
  const salt = salts[crop];
  if (!salt) {
    throw new Error(
      `No salt for "${crop}" in lib/market/salts.json. Run "npm run pick-salts".`,
    );
  }
  return salt;
}

/**
 * The drift x on day k, where k = 0 is the generator start date.
 * Series are computed once per (crop, salt) so picking salts stays fast.
 */
const SERIES_CACHE = new Map<string, number[]>();

function seriesFor(crop: Crop, salt: string, k: number): number[] {
  const key = `${crop}|${salt}`;
  let series = SERIES_CACHE.get(key);
  if (!series) {
    series = [0];
    SERIES_CACHE.set(key, series);
  }
  for (let i = series.length; i <= k; i++) {
    const rand = seededValue(`${crop}${salt}${i}`);
    const e = (rand - 0.5) * 2 * NOISE;
    const next = series[i - 1] - PULL * series[i - 1] + e;
    series.push(Math.max(-MAX_DRIFT, Math.min(MAX_DRIFT, next)));
  }
  return series;
}

export function driftAt(crop: Crop, k: number, salt: string = saltFor(crop)): number {
  if (k < 0) {
    throw new Error(`Day ${k} is before the start date ${MARKET.startDate}.`);
  }
  return seriesFor(crop, salt, k)[k];
}

/** Price of one crop on one calendar day, in kobo. */
export function priceOn(crop: Crop, dateOnly: string, salt?: string): number {
  const k = daysBetween(MARKET.startDate, dateOnly);
  const entry = catalogFor(crop);
  return Math.round(entry.basePriceKobo * Math.exp(driftAt(crop, k, salt ?? saltFor(crop))));
}

export interface MarketTick {
  crop: Crop;
  /** YYYY-MM-DD in APP_TZ. */
  date: string;
  priceKobo: number;
  unit: Unit;
  source: PriceSource;
}

/** One simulated tick for a crop on a day. */
export function tickFor(crop: Crop, dateOnly: string, salt?: string): MarketTick {
  const entry = catalogFor(crop);
  return {
    crop,
    date: dateOnly,
    priceKobo: priceOn(crop, dateOnly, salt),
    unit: entry.unit,
    source: PriceSource.SIMULATED,
  };
}

/** Latest tick for one crop on `today`. */
export function latestTickFor(crop: Crop, today: string): MarketTick {
  return tickFor(crop, today);
}

/** Latest tick for every crop in the catalog. */
export function latestTicks(today: string): MarketTick[] {
  return CATALOG.map((entry) => tickFor(entry.crop, today));
}

/**
 * Daily prices for one crop, oldest first, ending on (and including) endDate.
 * Days before the generator start date are skipped, never invented.
 */
export function historyFor(
  crop: Crop,
  endDate: string,
  days: number,
  salt?: string,
): MarketTick[] {
  const count = Math.max(0, Math.trunc(days));
  const dates = lastNDays(endDate, count).filter((date) => daysBetween(MARKET.startDate, date) >= 0);
  return dates.map((date) => tickFor(crop, date, salt));
}

/** Price series only (oldest first) — what the trend maths wants. */
export function historyPrices(
  crop: Crop,
  endDate: string,
  days: number,
  salt?: string,
): number[] {
  return historyFor(crop, endDate, days, salt).map((tick) => tick.priceKobo);
}
