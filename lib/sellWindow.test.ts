import { describe, expect, it } from "vitest";
import { Crop } from "@prisma/client";
import { CROPS, cropLabel } from "@/lib/market/catalog";
import { historyPrices } from "@/lib/market/generator";
import { todayInTz } from "@/lib/market/dates";
import { harvestAlert } from "@/lib/weather/alerts";
import { sellWindow, type SellCosts } from "./sellWindow";

/**
 * Sell-now-or-hold logic (docs/01-agriprice.md).
 *
 * The price series below are arithmetic (start + step per day), so slope and
 * mean can be worked out by hand: slope = step exactly, mean = start +
 * step x 6.5. Boundary cases use percentages that are exact binary
 * fractions (12.5 = 1/8) so the >= comparison lands on the same representable
 * number on both sides — the test then checks the rule, not float luck.
 */

function series(step: number, start = 10000, days = 14): number[] {
  return Array.from({ length: days }, (_, i) => start + step * i);
}

const COSTS: SellCosts = {
  storageKoboPerKgPerWeek: 200,
  spoilagePctPerWeek: 1,
  minGainPct: 2,
};

describe("sellWindow", () => {
  it("holds when the price is rising with a big gain", () => {
    // slope 100 kobo/day, mean 10,650, trend 6.57%/week
    const r = sellWindow(series(100), 1000, COSTS);

    expect(r.status).toBe("HOLD");
    expect(r.weeklyTrendPct).toBeCloseTo(6.5728, 3);
    expect(r.latestKobo).toBe(11_300);
    expect(r.projectedKobo).toBe(12_043); // 12,042.72 rounds up
    expect(r.holdCostPerKgKobo).toBe(313); // 200 storage + 113 spoilage
    expect(r.netGainPerKgKobo).toBe(430); // 429.72 rounds up
    expect(r.stockValueNowKobo).toBe(11_300_000);
    expect(r.changeIfWaitKobo).toBe(429_723); // 429.72 x 1,000 kg, rounded
    expect(r.costsNotSet).toBe(false);
    expect(r.message).toBe(
      "Price is rising about 6.6% a week. Waiting 1 week could earn ₦4,297 more on your stock.",
    );
  });

  it("sells now when the price rises but waiting costs more than the gain", () => {
    // trend +0.70%/week earns ~70 kobo/kg; storage + spoilage cost ~301
    const r = sellWindow(series(10), 1000, COSTS);

    expect(r.status).toBe("SELL_NOW");
    expect(r.weeklyTrendPct).toBeGreaterThan(0);
    expect(r.netGainPerKgKobo).toBe(-231);
    expect(r.message).toBe("Waiting costs more than you would gain.");
  });

  it("sells now when the price is falling", () => {
    const r = sellWindow(series(-150, 12000), 1200, COSTS);

    expect(r.status).toBe("SELL_NOW");
    expect(r.weeklyTrendPct).toBeLessThan(0);
    expect(r.latestKobo).toBe(10_050);
    expect(r.netGainPerKgKobo).toBe(-1258);
    expect(r.changeIfWaitKobo).toBeLessThan(0); // waiting loses money on the stock
    expect(r.message).toBe("Price is not going up.");
  });

  it("sells now when the price is flat", () => {
    const r = sellWindow(series(0), 1000, COSTS);

    expect(r.status).toBe("SELL_NOW");
    expect(r.weeklyTrendPct).toBe(0);
    expect(r.latestKobo).toBe(10_000);
    expect(r.projectedKobo).toBe(10_000);
    expect(r.netGainPerKgKobo).toBe(-300); // holding only costs money
    expect(r.changeIfWaitKobo).toBe(-300_000);
    expect(r.message).toBe("Price is not going up.");
  });

  it("needs data with exactly 6 prices", () => {
    const r = sellWindow(series(100).slice(0, 6), 500, COSTS);

    expect(r.status).toBe("NEED_DATA");
    expect(r.message).toBe("Not enough price history yet.");
    expect(r.weeklyTrendPct).toBe(0);
    expect(r.projectedKobo).toBe(10_500);
    expect(r.changeIfWaitKobo).toBe(0);
    // Even without a trend the page can still value the stock.
    expect(r.latestKobo).toBe(10_500);
    expect(r.stockValueNowKobo).toBe(5_250_000);
  });

  it("works with exactly 7 prices", () => {
    const r = sellWindow(series(100).slice(0, 7), 1000, COSTS);

    expect(r.status).not.toBe("NEED_DATA");
    expect(r.status).toBe("HOLD");
    expect(r.message).toMatch(/^Price is rising about 6\.8% a week\./);
  });

  it("survives an empty price list without inventing data", () => {
    const r = sellWindow([], 500, COSTS);

    expect(r.status).toBe("NEED_DATA");
    expect(r.latestKobo).toBe(0);
    expect(r.stockValueNowKobo).toBe(0);
  });

  it("uses zero costs and flags them when the farm has never set any", () => {
    const rising = series(100);

    const noRow = sellWindow(rising, 1000, null);
    expect(noRow.costsNotSet).toBe(true);
    expect(noRow.holdCostPerKgKobo).toBe(0);
    expect(noRow.status).toBe("HOLD"); // default minGainPct of 2% still applies

    const empty = sellWindow(rising, 1000, {});
    expect(empty.costsNotSet).toBe(true);

    const partial = sellWindow(rising, 1000, {
      storageKoboPerKgPerWeek: 200,
      spoilagePctPerWeek: null,
      minGainPct: null,
    });
    expect(partial.costsNotSet).toBe(false);
    expect(partial.holdCostPerKgKobo).toBe(200);

    // Zero costs never turn a falling price into a hold.
    const falling = sellWindow(series(-150, 12000), 1000, null);
    expect(falling.status).toBe("SELL_NOW");
  });

  it("clamps the weekly trend at +20%", () => {
    // raw trend +36.8%/week
    const r = sellWindow(series(800), 10, COSTS);

    expect(r.weeklyTrendPct).toBe(20);
    expect(r.status).toBe("HOLD");
  });

  it("clamps the weekly trend at -20%", () => {
    // raw trend -37.8%/week
    const r = sellWindow(series(-800, 20000), 10, COSTS);

    expect(r.weeklyTrendPct).toBe(-20);
    expect(r.status).toBe("SELL_NOW");
    expect(r.message).toBe("Price is not going up.");
  });

  it("holds when the gain is exactly at the minimum", () => {
    // trend exactly 12.5%, no costs: netGain = 12.5% of latest = the minimum
    const exact: SellCosts = {
      storageKoboPerKgPerWeek: 0,
      spoilagePctPerWeek: 0,
      minGainPct: 12.5,
    };
    const atLine = sellWindow(series(200, 9900), 100, exact);

    expect(atLine.weeklyTrendPct).toBe(12.5);
    expect(atLine.latestKobo).toBe(12_500);
    expect(atLine.projectedKobo).toBe(14_063); // 14,062.5 rounds up
    expect(atLine.netGainPerKgKobo).toBe(1563); // 1,562.5 rounds up
    expect(atLine.status).toBe("HOLD"); // >= includes the line itself
    expect(atLine.message).toBe(
      "Price is rising about 12.5% a week. Waiting 1 week could earn ₦1,563 more on your stock.",
    );

    // Just under the line the other way: same prices, minimum 13%.
    const justUnder = sellWindow(series(200, 9900), 100, { ...exact, minGainPct: 13 });
    expect(justUnder.status).toBe("SELL_NOW");
    expect(justUnder.message).toBe("Waiting costs more than you would gain.");
  });

  it("still decides per kg when the stock is 0 kg", () => {
    // The rule is about the price per kg; stock size only scales the money.
    const r = sellWindow(series(100), 0, COSTS);

    expect(r.status).toBe("HOLD");
    expect(r.stockValueNowKobo).toBe(0);
    expect(r.changeIfWaitKobo).toBe(0);
    expect(r.message).toContain("₦0");
  });

  it("rounds every kobo amount to a whole kobo", () => {
    // trend clamped to +20%, latest 20,439: projected 24,526.8,
    // holdCost 333 + 2,452.68 = 2,785.68, netGain 1,302.12
    const r = sellWindow(series(803), 7, {
      storageKoboPerKgPerWeek: 333,
      spoilagePctPerWeek: 12,
      minGainPct: 2,
    });

    expect(r.status).toBe("HOLD");
    expect(r.weeklyTrendPct).toBe(20);
    expect(r.latestKobo).toBe(20_439);
    expect(r.projectedKobo).toBe(24_527);
    expect(r.holdCostPerKgKobo).toBe(2786);
    expect(r.netGainPerKgKobo).toBe(1302);
    expect(r.stockValueNowKobo).toBe(143_073);
    // Rounded from 1,302.12 x 7 = 9,114.84, not from the already rounded 1,302.
    expect(r.changeIfWaitKobo).toBe(9115);
  });

  it("is not changed by the harvest rain alert", () => {
    // The harvest alert fires for maize with 25 mm of rain in 3 days...
    const daily = [25, 0, 0].map((rainMm, i) => ({
      date: `2026-10-${18 + i}`,
      minC: 24,
      maxC: 30,
      rainMm,
      rainChancePct: 80,
    }));
    expect(harvestAlert(daily, [Crop.MAIZE])).not.toBeNull();

    // ...and the badge still follows the prices alone, either way.
    expect(sellWindow(series(-150, 12000), 1200, COSTS).status).toBe("SELL_NOW");
    expect(sellWindow(series(100), 1200, COSTS).status).toBe("HOLD");
  });

  it("decides every crop from the real generated prices", () => {
    const today = todayInTz();
    // The seeded cost settings; crops without a row get none, like the page will pass.
    const seedCosts: Partial<Record<Crop, SellCosts>> = {
      [Crop.MAIZE]: { storageKoboPerKgPerWeek: 200, spoilagePctPerWeek: 1, minGainPct: 2 },
      [Crop.CASSAVA]: { storageKoboPerKgPerWeek: 100, spoilagePctPerWeek: 4, minGainPct: 2 },
      [Crop.TOMATO]: { storageKoboPerKgPerWeek: 300, spoilagePctPerWeek: 12, minGainPct: 3 },
    };

    const rows = CROPS.map((crop) => ({
      crop,
      result: sellWindow(historyPrices(crop, today, 14), 500, seedCosts[crop] ?? null),
    }));

    for (const { crop, result } of rows) {
      console.log(
        `${cropLabel(crop).padEnd(13)} ${result.status.padEnd(9)} ` +
          `trend ${result.weeklyTrendPct.toFixed(1).padStart(6)}% · ` +
          `latest ₦${(result.latestKobo / 100).toLocaleString("en-NG")} · ` +
          `wait ${result.changeIfWaitKobo} kobo · ${result.costsNotSet ? "costs not set" : "costs set"}`,
      );

      expect(["NEED_DATA", "HOLD", "SELL_NOW"]).toContain(result.status);
      expect(result.message.length).toBeGreaterThan(0);
      expect(Number.isInteger(result.latestKobo)).toBe(true);
      expect(Number.isInteger(result.changeIfWaitKobo)).toBe(true);
      expect(result.latestKobo).toBeGreaterThan(0);
    }

    expect(rows).toHaveLength(CROPS.length);
  });
});
