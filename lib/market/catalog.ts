import { Crop, Unit } from "@prisma/client";
import { MARKET } from "@/lib/config";

/**
 * Market catalog (docs/00-global.md §3).
 * Base prices are sample naira amounts per unit, stored here in kobo so no
 * float money ever enters the database. EDIT these to match local markets.
 * Every number in this file is a placeholder until an expert reviews it.
 */
export interface CatalogEntry {
  crop: Crop;
  /** "Maize" for the screen, "MAIZE" for the API. */
  label: string;
  basePriceKobo: number;
  unit: Unit;
  /** "kg" / "tray of 30" / "litre" for the screen. */
  unitLabel: string;
}

export const CATALOG: readonly CatalogEntry[] = [
  { crop: Crop.MAIZE, label: "Maize", basePriceKobo: 600 * 100, unit: Unit.KG, unitLabel: "kg" },
  { crop: Crop.CASSAVA, label: "Cassava", basePriceKobo: 350 * 100, unit: Unit.KG, unitLabel: "kg" },
  { crop: Crop.YAM, label: "Yam", basePriceKobo: 900 * 100, unit: Unit.KG, unitLabel: "kg" },
  { crop: Crop.RICE_PADDY, label: "Rice (paddy)", basePriceKobo: 850 * 100, unit: Unit.KG, unitLabel: "kg" },
  { crop: Crop.TOMATO, label: "Tomato", basePriceKobo: 700 * 100, unit: Unit.KG, unitLabel: "kg" },
  { crop: Crop.TILAPIA, label: "Tilapia", basePriceKobo: 2500 * 100, unit: Unit.KG, unitLabel: "kg" },
  { crop: Crop.CATFISH, label: "Catfish", basePriceKobo: 2800 * 100, unit: Unit.KG, unitLabel: "kg" },
  { crop: Crop.EGGS_TRAY, label: "Eggs (tray of 30)", basePriceKobo: 3800 * 100, unit: Unit.TRAY, unitLabel: "tray of 30" },
  { crop: Crop.PALM_OIL, label: "Palm oil", basePriceKobo: 1800 * 100, unit: Unit.LITRE, unitLabel: "litre" },
] as const;

export const CROPS: readonly Crop[] = CATALOG.map((entry) => entry.crop);

const BY_CROP = new Map<Crop, CatalogEntry>(CATALOG.map((entry) => [entry.crop, entry]));

/** The catalog entry for a crop. Throws for a crop the catalog does not know. */
export function catalogFor(crop: Crop): CatalogEntry {
  const entry = BY_CROP.get(crop);
  if (!entry) {
    throw new Error(`Unknown crop "${crop}". Add it to lib/market/catalog.ts first.`);
  }
  return entry;
}

/** Screen label for a crop, e.g. MAIZE -> "Maize". */
export function cropLabel(crop: Crop): string {
  return catalogFor(crop).label;
}

/** Days of history one request may ask for. */
export function clampHistoryDays(days: number): number {
  if (!Number.isFinite(days)) return MARKET.defaultHistoryDays;
  return Math.max(1, Math.min(MARKET.maxHistoryDays, Math.trunc(days)));
}
