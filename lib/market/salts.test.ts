import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkSaltsFor, pickSalts, type SaltMap } from "../../scripts/pick-salts";
import { todayInTz } from "./dates";

/**
 * The demo rule (docs/00-global.md §3): for TODAY's date at least one crop
 * must be rising and one falling over the last 14 days.
 *
 * The salts are never written in this test — it reads lib/market/salts.json
 * and calls the picker's own check, which is the same function "npm run
 * pick-salts" (predev / prebuild) uses.
 */

const salts: SaltMap = JSON.parse(
  readFileSync(new URL("./salts.json", import.meta.url), "utf8"),
) as SaltMap;

describe("salt picker check", () => {
  it("salts.json passes the picker's own check for today's date", () => {
    const today = todayInTz();
    const check = checkSaltsFor(today, salts);

    // Print the 14-day trends, as the rules ask, so a failure is readable.
    const lines = check.trends.map(
      (t) => `  ${t.crop.padEnd(12)} ${t.trendPct.toFixed(2).padStart(7)}%  ${t.direction}`,
    );
    console.log(`14-day trends for ${today}:\n${lines.join("\n")}`);

    expect(check.rising.length, "no crop is rising").toBeGreaterThanOrEqual(1);
    expect(check.falling.length, "no crop is falling").toBeGreaterThanOrEqual(1);
    expect(check.passes).toBe(true);
  });

  it("pickSalts keeps salts that already pass for today", () => {
    const today = todayInTz();
    const result = pickSalts(today, salts);

    expect(result.changed).toBe(false);
    expect(result.salts).toEqual(salts);
    expect(result.check.today).toBe(today);
    expect(result.check.passes).toBe(true);
  });

  it("pickSalts does not mutate what it is given", () => {
    const today = todayInTz();
    const copy: SaltMap = { ...salts };
    pickSalts(today, copy);
    expect(copy).toEqual(salts);
  });

  it("pickSalts finds one rising and one falling crop on many different dates", () => {
    // Step 0: the rule must come from the picker, not from the calendar.
    // One date per season plus the generator's second day: whatever day the
    // suite runs, the picker itself can always produce a demo with both
    // states. (The very first day, 2026-01-01, has a single price and no
    // trend at all — nothing can be rising or falling yet.)
    const dates = [
      "2026-01-02",
      "2026-02-14",
      "2026-04-30",
      "2026-07-01",
      "2026-09-15",
      "2026-12-31",
    ];

    for (const today of dates) {
      const result = pickSalts(today, salts);
      expect(result.check.passes, `no salts pass for ${today}`).toBe(true);
      expect(result.check.rising.length, `nothing rises on ${today}`).toBeGreaterThanOrEqual(1);
      expect(result.check.falling.length, `nothing falls on ${today}`).toBeGreaterThanOrEqual(1);
    }
  }, 60_000);
});
