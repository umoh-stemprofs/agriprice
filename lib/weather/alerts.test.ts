import { describe, expect, it } from "vitest";
import { Crop } from "@prisma/client";
import { harvestAlert, rainTotalNextDays } from "./alerts";
import type { DailyWeather } from "./types";

/** Harvest alert (docs/01-agriprice.md rule 9): >= 20 mm in 3 days,
 *  for MAIZE and RICE_PADDY only. */

function days(rainByDay: number[]): DailyWeather[] {
  return rainByDay.map((rainMm, index) => ({
    date: `2026-10-${String(18 + index).padStart(2, "0")}`,
    minC: 24,
    maxC: 30,
    rainMm,
    rainChancePct: rainMm > 0 ? 80 : 10,
  }));
}

describe("rainTotalNextDays", () => {
  it("sums the first 3 days only", () => {
    expect(rainTotalNextDays(days([5, 10, 30, 100]))).toBe(45);
  });

  it("is 0 with no forecast days", () => {
    expect(rainTotalNextDays([])).toBe(0);
  });
});

describe("harvestAlert", () => {
  it("fires at 20 mm total for maize and rice", () => {
    const alert = harvestAlert(days([10, 5, 5, 40]), [Crop.MAIZE, Crop.RICE_PADDY]);
    expect(alert).not.toBeNull();
    expect(alert?.rainMm).toBe(20);
    expect(alert?.days).toBe(3);
    expect(alert?.crops).toEqual([Crop.MAIZE, Crop.RICE_PADDY]);
    expect(alert?.message).toBe("Heavy rain coming. Harvest or cover the crop early.");
  });

  it("does not fire below 20 mm", () => {
    expect(harvestAlert(days([10, 5, 4.9]), [Crop.MAIZE])).toBeNull();
  });

  it("ignores rain on day 4", () => {
    expect(harvestAlert(days([0, 0, 0, 60]), [Crop.MAIZE])).toBeNull();
  });

  it("counts rain on day 3", () => {
    expect(harvestAlert(days([0, 0, 25]), [Crop.RICE_PADDY])).not.toBeNull();
  });

  it("does not fire for crops outside maize and rice", () => {
    expect(harvestAlert(days([50, 50, 50]), [Crop.TOMATO, Crop.YAM])).toBeNull();
  });

  it("only lists the affected crops the farm holds", () => {
    const alert = harvestAlert(days([30, 0, 0]), [Crop.MAIZE, Crop.YAM, Crop.TOMATO]);
    expect(alert?.crops).toEqual([Crop.MAIZE]);
  });

  it("does not fire when the farm holds no stock of either crop", () => {
    expect(harvestAlert(days([40, 40, 40]), [])).toBeNull();
  });
});
