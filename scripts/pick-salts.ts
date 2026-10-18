import { promises as fs } from "node:fs";
import path from "node:path";
import { Crop } from "@prisma/client";
import { CATALOG } from "@/lib/market/catalog";
import { MARKET } from "@/lib/config";
import { todayInTz } from "@/lib/market/dates";
import { historyPrices } from "@/lib/market/generator";
import { directionOf, weeklyTrendPct, TrendDirection } from "@/lib/market/trend";

/**
 * Salt picker (docs/01-agriprice.md, market feed).
 *
 * The demo must show both states: at least one crop rising and one falling
 * over the last 14 days. Salts decide the shape of each crop's series, so
 * this script searches for salts that satisfy the rule for TODAY's date and
 * writes them to lib/market/salts.json.
 *
 * Runs as "predev" and "prebuild". If the current salts already pass for
 * today, nothing is rewritten.
 */

export type SaltMap = Record<string, string>;

export interface CropTrend {
  crop: Crop;
  salt: string;
  trendPct: number;
  direction: TrendDirection;
}

export interface SaltCheck {
  today: string;
  trends: CropTrend[];
  rising: Crop[];
  falling: Crop[];
  flat: Crop[];
  passes: boolean;
}

/** Preferred salts also keep passing for these extra days (less file churn).
 *  The rule that MUST hold is today's check alone. */
const STABLE_EXTRA_DAYS = 3;
/** Search bound: a salt per candidate index, e.g. maize-0, maize-1, ... */
const MAX_CANDIDATES = 4000;

function trendFor(crop: Crop, salt: string, today: string): CropTrend {
  const prices = historyPrices(crop, today, MARKET.trendDays, salt);
  return {
    crop,
    salt,
    trendPct: weeklyTrendPct(prices),
    direction: directionOf(prices),
  };
}

/**
 * The picker's own check: does this salt map give, for today's date, at least
 * one crop rising and one falling over the last 14 days?
 */
export function checkSaltsFor(today: string, salts: SaltMap): SaltCheck {
  const trends = CATALOG.map((entry) => {
    const salt = salts[entry.crop] ?? "";
    return trendFor(entry.crop, salt, today);
  });
  const rising = trends.filter((t) => t.direction === "rising").map((t) => t.crop);
  const falling = trends.filter((t) => t.direction === "falling").map((t) => t.crop);
  const flat = trends.filter((t) => t.direction === "flat").map((t) => t.crop);
  return {
    today,
    trends,
    rising,
    falling,
    flat,
    passes: rising.length >= 1 && falling.length >= 1,
  };
}

function addDaysSafe(dateOnly: string, n: number): string {
  const date = new Date(`${dateOnly}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

/** The rule for today's date. */
function passesToday(today: string, salts: SaltMap): boolean {
  return checkSaltsFor(today, salts).passes;
}

/** Softer preference: also keeps passing for the next few days. */
function passesStably(today: string, salts: SaltMap): boolean {
  for (let offset = 0; offset <= STABLE_EXTRA_DAYS; offset++) {
    if (!passesToday(addDaysSafe(today, offset), salts)) return false;
  }
  return true;
}

export interface PickResult {
  salts: SaltMap;
  changed: boolean;
  check: SaltCheck;
}

/**
 * Keeps the current salts when they already pass for today; otherwise
 * searches for a replacement, one crop at a time.
 */
export function pickSalts(today: string, current: SaltMap): PickResult {
  const start: SaltMap = { ...current };
  for (const entry of CATALOG) {
    if (!start[entry.crop]) {
      throw new Error(`Missing salt for ${entry.crop} in lib/market/salts.json.`);
    }
  }

  if (passesToday(today, start)) {
    return { salts: start, changed: false, check: checkSaltsFor(today, start) };
  }

  const salts: SaltMap = { ...start };
  let fallback: SaltMap | null = null;

  for (const entry of CATALOG) {
    for (let i = 0; i < MAX_CANDIDATES; i++) {
      const candidate = `${entry.crop.toLowerCase()}-${i}`;
      salts[entry.crop] = candidate;
      if (passesStably(today, salts)) {
        return { salts: { ...salts }, changed: true, check: checkSaltsFor(today, salts) };
      }
      if (fallback === null && passesToday(today, salts)) {
        fallback = { ...salts };
      }
    }
    salts[entry.crop] = start[entry.crop]; // this crop's old salt goes back
  }

  if (fallback) {
    return { salts: fallback, changed: true, check: checkSaltsFor(today, fallback) };
  }

  throw new Error(
    "Could not find salts that give one rising and one falling crop today. " +
      "Check lib/market/trend.ts thresholds.",
  );
}

function printTrends(check: SaltCheck): void {
  const width = Math.max(...check.trends.map((t) => t.crop.length)) + 2;
  console.log(`\n14-day trends for ${check.today} (weekly %):`);
  for (const trend of check.trends) {
    const arrow =
      trend.direction === "rising" ? "up" : trend.direction === "falling" ? "down" : "flat";
    console.log(
      `  ${trend.crop.padEnd(width)} ${trend.trendPct.toFixed(2).padStart(7)}%  ${arrow}`,
    );
  }
  console.log(
    `  rising: ${check.rising.join(", ") || "none"} · falling: ${check.falling.join(", ") || "none"}\n`,
  );
}

/** First-run default so the script can bootstrap the file. */
function defaultSalts(): SaltMap {
  const map: SaltMap = {};
  for (const entry of CATALOG) map[entry.crop] = `${entry.crop.toLowerCase()}-0`;
  return map;
}

async function main(): Promise<void> {
  const saltsPath = path.join(__dirname, "..", "lib", "market", "salts.json");
  let current: SaltMap;
  try {
    current = JSON.parse(await fs.readFile(saltsPath, "utf8"));
  } catch {
    current = defaultSalts();
  }
  const today = todayInTz();

  const result = pickSalts(today, current);

  if (result.changed) {
    await fs.writeFile(saltsPath, `${JSON.stringify(result.salts, null, 2)}\n`, "utf8");
    console.log("pick-salts: updated lib/market/salts.json");
  } else {
    console.log("pick-salts: existing salts still pass for today, nothing changed");
  }
  printTrends(result.check);
}

const invokedDirectly =
  typeof process.argv[1] === "string" &&
  process.argv[1].replace(/\\/g, "/").endsWith("pick-salts.ts");

if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error("pick-salts failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
