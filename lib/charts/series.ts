import { addDays } from "@/lib/market/dates";

/**
 * Chart series builders (docs/00-global.md §2: logic is pure functions in
 * /lib with tests). Everything here returns plain numbers and dates so the
 * Recharts components only draw, and "Never invent data" (docs/design.md §4)
 * is easy to keep: no series here ever contains a point that was not given to
 * it, and a missing projection stays missing rather than being faked.
 */

export interface PricePoint {
  /** YYYY-MM-DD in APP_TZ. */
  date: string;
  /** Integer kobo, oldest -> newest. */
  priceKobo: number;
}

export interface PriceSeries {
  /** The prices that actually exist. */
  actual: PricePoint[];
  /**
   * Two points: the last actual price and the same price one week later with
   * the weekly trend applied. First point equals the last actual point so the
   * dotted line connects. Empty when there is nothing to project from.
   */
  projection: PricePoint[];
}

/**
 * 30-day history plus the next-week projection for the dotted line
 * (docs/01-agriprice.md, crop detail: "line chart of 30 days with the
 * next-week projection as a dotted line").
 *
 * @param prices daily prices, oldest -> newest (kobo)
 * @param weeklyTrendPct the trend sellWindow used, or null when there is not
 *   enough history to project — then there is no projection at all
 */
export function projectionSeries(
  prices: readonly number[],
  dates: readonly string[],
  weeklyTrendPct: number | null,
): PriceSeries {
  const length = Math.min(prices.length, dates.length);
  const actual: PricePoint[] = [];
  for (let i = 0; i < length; i++) {
    actual.push({ date: dates[i], priceKobo: prices[i] });
  }

  const last = actual[actual.length - 1];
  if (!last || weeklyTrendPct === null || !Number.isFinite(weeklyTrendPct)) {
    return { actual, projection: [] };
  }

  // Same arithmetic as sellWindow's projected price, so the dotted line never
  // contradicts the sentence under the status pill.
  const projectedPrice = Math.round(last.priceKobo * (1 + weeklyTrendPct / 100));

  return {
    actual,
    projection: [
      { date: last.date, priceKobo: last.priceKobo },
      { date: addDays(last.date, 7), priceKobo: projectedPrice },
    ],
  };
}

export interface ValueSlice {
  label: string;
  /** Integer kobo. */
  valueKobo: number;
  /** True for the rolled-up remainder slice. */
  isOther: boolean;
}

/**
 * Estimated market value by crop for the bar chart and the pie
 * (docs/00-global.md §3, "value by crop as a bar chart and a pie chart (max 5
 * slices)").
 *
 * Sorted biggest first. Slices with nothing in them are dropped — a crop the
 * farm does not hold is not a zero-width slice, it is simply not there. More
 * than `maxSlices` crops roll the tail into one "Other" slice, and with
 * exactly `maxSlices` there is no "Other" at all.
 */
export function valueByCrop(
  rows: readonly { label: string; valueKobo: number }[],
  maxSlices: number = 5,
): ValueSlice[] {
  const filled = rows
    .filter((row) => Number.isFinite(row.valueKobo) && row.valueKobo > 0)
    .slice()
    .sort((a, b) => b.valueKobo - a.valueKobo)
    .map((row) => ({ label: row.label, valueKobo: row.valueKobo, isOther: false }));

  if (filled.length <= maxSlices) return filled;
  if (maxSlices <= 1) {
    return [
      {
        label: "Other",
        valueKobo: filled.reduce((sum, row) => sum + row.valueKobo, 0),
        isOther: true,
      },
    ];
  }

  const head = filled.slice(0, maxSlices - 1);
  const tail = filled.slice(maxSlices - 1);
  return [
    ...head,
    {
      label: "Other",
      valueKobo: tail.reduce((sum, row) => sum + row.valueKobo, 0),
      isOther: true,
    },
  ];
}

export function totalOf(slices: readonly { valueKobo: number }[]): number {
  return slices.reduce((sum, slice) => sum + slice.valueKobo, 0);
}
