import { describe, expect, it } from "vitest";
import { Crop } from "@prisma/client";
import { projectionSeries, totalOf, valueByCrop } from "./series";
import { addDays, lastNDays } from "@/lib/market/dates";
import { historyPrices } from "@/lib/market/generator";
import { sellWindow } from "@/lib/sellWindow";

/**
 * Chart series (docs/design.md §4: never invent data; pie max 5 slices with
 * the rest as "Other").
 */

const DATES_30 = lastNDays("2026-10-18", 30);

function pricesOver(days: number, start = 1000, step = 10): number[] {
  return Array.from({ length: days }, (_, index) => start + index * step);
}

describe("projectionSeries", () => {
  it("keeps the real prices and appends a two-point dotted projection", () => {
    const prices = pricesOver(30);
    const series = projectionSeries(prices, DATES_30, 5);

    expect(series.actual).toHaveLength(30);
    expect(series.actual[0]).toEqual({ date: DATES_30[0], priceKobo: 1000 });
    expect(series.projection).toHaveLength(2);

    // The dotted line starts on the last real point, so the two lines meet.
    expect(series.projection[0]).toEqual(series.actual[series.actual.length - 1]);

    const last = series.actual[series.actual.length - 1];
    expect(series.projection[1].date).toBe(addDays(last.date, 7));
    expect(series.projection[1].priceKobo).toBe(Math.round(last.priceKobo * 1.05));
  });

  it("agrees with the projected price sellWindow reports", () => {
    const prices = historyPrices(Crop.MAIZE, "2026-10-18", 14);
    const dates = lastNDays("2026-10-18", 14);

    const decision = sellWindow(prices, 1200, {
      storageKoboPerKgPerWeek: 200,
      spoilagePctPerWeek: 1,
      minGainPct: 2,
    });
    const series = projectionSeries(prices, dates, decision.weeklyTrendPct);

    expect(series.projection[0].priceKobo).toBe(decision.latestKobo);
    expect(series.projection[1].priceKobo).toBe(decision.projectedKobo);
    expect(series.projection[1].date).toBe(addDays("2026-10-18", 7));
  });

  it("shows a flat dotted line when the trend is 0", () => {
    const prices = pricesOver(30);
    const series = projectionSeries(prices, DATES_30, 0);

    expect(series.projection[1].priceKobo).toBe(series.projection[0].priceKobo);
  });

  it("draws no projection when there is not enough history", () => {
    const series = projectionSeries(pricesOver(6), lastNDays("2026-10-18", 6), null);
    expect(series.actual).toHaveLength(6);
    expect(series.projection).toEqual([]);
  });

  it("returns nothing at all for no prices", () => {
    expect(projectionSeries([], [], 5)).toEqual({ actual: [], projection: [] });
    expect(projectionSeries([], DATES_30, 5).projection).toEqual([]);
  });

  it("uses only the dates it actually has prices for", () => {
    const series = projectionSeries(pricesOver(30), lastNDays("2026-10-18", 5), 2);
    expect(series.actual).toHaveLength(5);
    expect(series.actual[4].date).toBe("2026-10-18");
    expect(series.projection[0].date).toBe("2026-10-18");
  });
});

describe("valueByCrop", () => {
  const rows = [
    { label: "Maize", valueKobo: 729_144_00 },
    { label: "Cassava", valueKobo: 220_278_00 },
    { label: "Tomato", valueKobo: 252_823_00 },
  ];

  it("sorts biggest first and keeps every crop when there are five or fewer", () => {
    const slices = valueByCrop(rows);

    expect(slices.map((slice) => slice.label)).toEqual(["Maize", "Tomato", "Cassava"]);
    expect(slices.every((slice) => !slice.isOther)).toBe(true);
    expect(totalOf(slices)).toBe(totalOf(rows));
  });

  it("leaves out crops the farm does not hold instead of drawing zero", () => {
    const slices = valueByCrop([
      { label: "Maize", valueKobo: 0 },
      { label: "Yam", valueKobo: -5 },
      { label: "Catfish", valueKobo: 1_000_00 },
    ]);

    expect(slices).toEqual([{ label: "Catfish", valueKobo: 100_000, isOther: false }]);
  });

  it("returns nothing when there is no stock to chart", () => {
    expect(valueByCrop([])).toEqual([]);
    expect(valueByCrop([{ label: "Maize", valueKobo: 0 }])).toEqual([]);
  });

  it("rolls everything past five slices into one Other slice", () => {
    const many = [
      { label: "A", valueKobo: 100 },
      { label: "B", valueKobo: 90 },
      { label: "C", valueKobo: 80 },
      { label: "D", valueKobo: 70 },
      { label: "E", valueKobo: 60 },
      { label: "F", valueKobo: 50 },
      { label: "G", valueKobo: 40 },
    ];

    const slices = valueByCrop(many);

    expect(slices).toHaveLength(5);
    expect(slices.map((slice) => slice.label)).toEqual(["A", "B", "C", "D", "Other"]);
    expect(slices[4].isOther).toBe(true);
    expect(slices[4].valueKobo).toBe(60 + 50 + 40);
    expect(totalOf(slices)).toBe(totalOf(many));
  });

  it("respects a smaller slice budget", () => {
    const many = [
      { label: "A", valueKobo: 100 },
      { label: "B", valueKobo: 90 },
      { label: "C", valueKobo: 80 },
      { label: "D", valueKobo: 70 },
    ];

    const slices = valueByCrop(many, 3);
    expect(slices.map((slice) => slice.label)).toEqual(["A", "B", "Other"]);
    expect(slices[2].valueKobo).toBe(80 + 70);

    const onlyOther = valueByCrop(many, 1);
    expect(onlyOther).toEqual([{ label: "Other", valueKobo: 340, isOther: true }]);
  });
});
