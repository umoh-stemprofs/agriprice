import { promises as fs } from "node:fs";
import path from "node:path";
import { pickSalts, type SaltMap } from "./scripts/pick-salts";
import { todayInTz } from "./lib/market/dates";
import { CATALOG } from "./lib/market/catalog";

/**
 * Vitest global setup (step 0): refresh lib/market/salts.json for TODAY
 * before any test file loads — the same check "npm run pick-salts" runs as
 * predev and prebuild.
 *
 * Without this, the salt test would only pass on the day the file was last
 * written. With it, every test passes on any day, and the "one crop rising,
 * one falling" rule is still checked by the picker itself, never by salts
 * hardcoded in a test.
 */
export default async function setupSalts(): Promise<void> {
  const saltsPath = path.join(__dirname, "lib", "market", "salts.json");
  let current: SaltMap;
  try {
    current = JSON.parse(await fs.readFile(saltsPath, "utf8"));
  } catch {
    // First run: bootstrap with the picker's default candidate names.
    current = Object.fromEntries(
      CATALOG.map((entry) => [entry.crop, `${entry.crop.toLowerCase()}-0`]),
    );
  }

  const today = todayInTz();
  const result = pickSalts(today, current);

  if (result.changed) {
    await fs.writeFile(saltsPath, `${JSON.stringify(result.salts, null, 2)}\n`, "utf8");
    console.log(`vitest setup: refreshed lib/market/salts.json for ${today}`);
  }
}
