import { SELL_WINDOW } from "@/lib/config";
import { weeklyTrendPct } from "@/lib/market/trend";

/**
 * Sell now or hold (docs/01-agriprice.md, "Logic").
 *
 * Pure functions: the same inputs always give the same answer — no database,
 * no clock, no I/O. Every returned number is integer kobo; only the one
 * sentence formats naira, so the page can show it as-is.
 *
 * The harvest rain alert (lib/weather/alerts.ts) is deliberately NOT an input
 * here. It is shown next to the badge but never changes the status.
 */

export type SellStatus = "NEED_DATA" | "HOLD" | "SELL_NOW";

/** Cost of waiting per crop. A missing CostSetting row arrives as null/empty. */
export interface SellCosts {
  storageKoboPerKgPerWeek?: number | null;
  spoilagePctPerWeek?: number | null;
  minGainPct?: number | null;
}

export interface SellWindowResult {
  status: SellStatus;
  /** One plain sentence for the card, ready to show. */
  message: string;
  /** Expected move over one week in percent, clamped to +/- SELL_WINDOW.trendClampPct. */
  weeklyTrendPct: number;
  /** Newest price, kobo. */
  latestKobo: number;
  /** latest x (1 + trend/100), kobo. */
  projectedKobo: number;
  /** Storage + spoilage for one week of holding, kobo per kg. */
  holdCostPerKgKobo: number;
  /** projected - latest - holdCost, kobo per kg. Negative means waiting loses. */
  netGainPerKgKobo: number;
  /** qtyKg x latest — the whole stock sold today, kobo. */
  stockValueNowKobo: number;
  /** netGainPerKg x qtyKg — extra earned (HOLD) or lost (SELL_NOW) by waiting one week, kobo. */
  changeIfWaitKobo: number;
  /** True when the farm has never entered storage/spoilage for this crop. */
  costsNotSet: boolean;
}

/** "₦12,500" from 1250000 kobo. Formatting happens at the edge (docs/00-global.md §2). */
function naira(kobo: number): string {
  return `₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;
}

/** A missing cost is 0; anything non-finite is treated as missing too. */
function numberOr(value: number | null | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Decide, per crop, whether to sell now or hold for one week.
 *
 * @param pricesKobo last daily prices in kobo, oldest -> newest (up to 14)
 * @param qtyKg stock the farm holds, in kg
 * @param costs cost settings for this crop, or null when never entered
 */
export function sellWindow(
  pricesKobo: readonly number[],
  qtyKg: number,
  costs?: SellCosts | null,
): SellWindowResult {
  const latest = pricesKobo.length > 0 ? pricesKobo[pricesKobo.length - 1] : 0;

  const storage = numberOr(costs?.storageKoboPerKgPerWeek, 0);
  const spoilage = numberOr(costs?.spoilagePctPerWeek, 0);
  const minGainPct = numberOr(costs?.minGainPct, SELL_WINDOW.minGainPct);
  // The farm has told us nothing about the cost of waiting when both cost
  // fields are absent; the page uses this flag to offer a "Set costs" link.
  const costsNotSet =
    (costs?.storageKoboPerKgPerWeek ?? null) === null &&
    (costs?.spoilagePctPerWeek ?? null) === null;

  const base = {
    latestKobo: latest,
    stockValueNowKobo: Math.round(latest * qtyKg),
    costsNotSet,
  };

  // 1. Not enough history to see a trend.
  if (pricesKobo.length < SELL_WINDOW.minPrices) {
    return {
      ...base,
      status: "NEED_DATA",
      message: "Not enough price history yet.",
      weeklyTrendPct: 0,
      projectedKobo: latest,
      holdCostPerKgKobo: 0,
      netGainPerKgKobo: 0,
      changeIfWaitKobo: 0,
    };
  }

  // 2-3. Weekly trend from the least-squares slope of price against day
  // number, clamped to +/- SELL_WINDOW.trendClampPct (lib/market/trend.ts).
  const trend = weeklyTrendPct(pricesKobo);

  // 4. Where next week's price should land.
  const projected = latest * (1 + trend / 100);

  // 5. What one week of holding costs per kg.
  const holdCostPerKg = storage + (latest * spoilage) / 100;

  // 6. What one week of holding actually earns (or loses) per kg.
  const netGainPerKg = projected - latest - holdCostPerKg;

  // 7-8. Hold only when the gain beats the minimum the farmer asked for.
  // The comparison uses the unrounded per-kg numbers; kobo amounts are
  // rounded only where they are returned.
  const threshold = (latest * minGainPct) / 100;
  const hold = netGainPerKg >= threshold;

  const changeIfWait = Math.round(netGainPerKg * qtyKg);

  return {
    ...base,
    status: hold ? "HOLD" : "SELL_NOW",
    message: hold
      ? `Price is rising about ${trend.toFixed(1)}% a week. Waiting 1 week could earn ${naira(changeIfWait)} more on your stock.`
      : trend <= 0
        ? "Price is not going up."
        : "Waiting costs more than you would gain.",
    weeklyTrendPct: trend,
    projectedKobo: Math.round(projected),
    holdCostPerKgKobo: Math.round(holdCostPerKg),
    netGainPerKgKobo: Math.round(netGainPerKg),
    changeIfWaitKobo: changeIfWait,
  };
}
