import { describe, expect, it } from "vitest";
import { Crop, PriceSource, Unit } from "@prisma/client";
import { catalogFor } from "./catalog";
import { historyFor, historyPrices, latestTicks, priceOn } from "./generator";

/**
 * Generator rules (docs/00-global.md §3):
 * deterministic per (crop, salt, day), price = round(base * exp(x)),
 * source always SIMULATED. A fixed date is used so a failure is reproducible;
 * the salts are NOT pinned here — they come from lib/market/salts.json.
 */

const FIXED_DAY = "2026-10-18";

describe("deterministic generator", () => {
  it("gives the same price for the same crop and date, every call", () => {
    for (const crop of Object.values(Crop)) {
      const first = priceOn(crop, FIXED_DAY);
      const second = priceOn(crop, FIXED_DAY);
      expect(second).toBe(first);
    }
  });

  it("keeps history stable across repeated runs", () => {
    const a = historyFor(Crop.MAIZE, FIXED_DAY, 14);
    const b = historyFor(Crop.MAIZE, FIXED_DAY, 14);
    expect(b).toEqual(a);
  });

  it("produces different series for different crops", () => {
    const maize = historyPrices(Crop.MAIZE, FIXED_DAY, 14);
    const yam = historyPrices(Crop.YAM, FIXED_DAY, 14);
    expect(maize).not.toEqual(yam);
  });

  it("returns positive integer kobo prices from the catalog base", () => {
    const ticks = latestTicks(FIXED_DAY);
    expect(ticks).toHaveLength(Object.values(Crop).length);
    for (const tick of ticks) {
      expect(Number.isInteger(tick.priceKobo)).toBe(true);
      expect(tick.priceKobo).toBeGreaterThan(0);
      expect(tick.source).toBe(PriceSource.SIMULATED);
      expect(tick.unit).toBe(catalogFor(tick.crop).unit);
      expect(tick.date).toBe(FIXED_DAY);
    }
  });

  it("stays inside the +/-35% drift band around the base price", () => {
    for (const crop of Object.values(Crop)) {
      const base = catalogFor(crop).basePriceKobo;
      const price = priceOn(crop, FIXED_DAY);
      expect(price).toBeGreaterThanOrEqual(Math.round(base * Math.exp(-0.35)) - 1);
      expect(price).toBeLessThanOrEqual(Math.round(base * Math.exp(0.35)) + 1);
    }
  });

  it("returns history oldest first, one row per day", () => {
    const history = historyFor(Crop.RICE_PADDY, FIXED_DAY, 14);
    expect(history).toHaveLength(14);
    const dates = history.map((tick) => tick.date);
    expect([...dates].sort()).toEqual(dates);
    expect(dates[dates.length - 1]).toBe(FIXED_DAY);
  });

  it("marks every unit the catalog declares", () => {
    expect(catalogFor(Crop.EGGS_TRAY).unit).toBe(Unit.TRAY);
    expect(catalogFor(Crop.PALM_OIL).unit).toBe(Unit.LITRE);
    expect(catalogFor(Crop.MAIZE).unit).toBe(Unit.KG);
  });
});
