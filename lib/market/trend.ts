/**
 * Trend maths over a price series, oldest -> newest.
 * Pure, no I/O. Used by the salt picker now and by the sell-or-hold logic in
 * a later step, so it lives here rather than inside one feature.
 */

export const TREND_CLAMP_PCT = 20;
/** Below this the trend is treated as flat, not as a real move. */
export const FLAT_EPSILON_PCT = 0.5;

export function meanOf(prices: readonly number[]): number {
  if (prices.length === 0) return 0;
  return prices.reduce((sum, value) => sum + value, 0) / prices.length;
}

/** Least-squares slope of price against day number, in kobo per day. */
export function leastSquaresSlope(prices: readonly number[]): number {
  const n = prices.length;
  if (n < 2) return 0;
  const meanX = (n - 1) / 2;
  const meanY = meanOf(prices);
  let numerator = 0;
  let denominator = 0;
  prices.forEach((price, day) => {
    const dx = day - meanX;
    numerator += dx * (price - meanY);
    denominator += dx * dx;
  });
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Expected move over one week, in percent, clamped to +/-20%
 * (docs/01-agriprice.md step 3).
 */
export function weeklyTrendPct(prices: readonly number[]): number {
  const mean = meanOf(prices);
  if (mean <= 0 || prices.length < 2) return 0;
  const raw = (leastSquaresSlope(prices) * 7) / mean * 100;
  return Math.max(-TREND_CLAMP_PCT, Math.min(TREND_CLAMP_PCT, raw));
}

export type TrendDirection = "rising" | "falling" | "flat";

export function directionOf(
  prices: readonly number[],
  epsilonPct: number = FLAT_EPSILON_PCT,
): TrendDirection {
  const pct = weeklyTrendPct(prices);
  if (pct >= epsilonPct) return "rising";
  if (pct <= -epsilonPct) return "falling";
  return "flat";
}
