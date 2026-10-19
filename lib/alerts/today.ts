import { Crop } from "@prisma/client";
import { cropLabel } from "@/lib/market/catalog";
import type { HarvestAlert } from "@/lib/weather/alerts";
import type { SellStatus } from "@/lib/sellWindow";

/**
 * Today's alerts (docs/01-agriprice.md, page 8).
 *
 * Pure function: the same inputs always give the same list, so the page and
 * the tests agree. An alert is one icon, one word, one sentence and one
 * button (docs/design.md §6: buttons start with a verb).
 */

export type AlertKind = "harvest" | "decision" | "costs" | "weather";

/** Colour family for the word and icon (design.md §1: colour + icon + word). */
export type AlertTone = "success" | "warning" | "danger" | "info" | "muted";

export interface TodayAlert {
  /** Stable id, used as the React key and for the tests. */
  id: string;
  kind: AlertKind;
  /** The short word beside the icon, e.g. "Sell now". */
  word: string;
  /** One sentence: what it means and what to do about it. */
  sentence: string;
  /** Where the button goes. */
  href: string;
  /** Button label, starting with a verb. */
  action: string;
  /** Lower sorts first; the harvest alert is the most urgent. */
  priority: number;
  /** Which status colour the word and icon use. */
  tone: AlertTone;
  /** True for the DEMO_MODE preview card, which is never real data. */
  demo?: boolean;
}

/** One crop's decision, as the page already worked it out. */
export interface AlertCropInput {
  crop: Crop;
  status: SellStatus;
  /** The sellWindow sentence for this crop. */
  message: string;
  costsNotSet: boolean;
}

export interface BuildAlertsInput {
  /** Only crops the farm actually holds. */
  crops: readonly AlertCropInput[];
  /** The harvest alert, or null when the forecast has no heavy rain. */
  harvest: HarvestAlert | null;
  /** One sentence from the weather provider, or null when weather worked. */
  weatherError: string | null;
}

const PRIORITY = {
  harvest: 10,
  weather: 20,
  sellNow: 30,
  hold: 40,
  needData: 50,
  costs: 60,
} as const;

function listWords(labels: string[]): string {
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

/**
 * Builds every alert that applies to today, in the order the farmer should
 * read them. Crops the farm does not hold are never given a decision alert,
 * and a crop with no cost row is reported once as a group, not once per crop.
 */
export function buildTodayAlerts(input: BuildAlertsInput): TodayAlert[] {
  const alerts: TodayAlert[] = [];

  if (input.harvest) {
    const crops = listWords(input.harvest.crops.map(cropLabel));
    alerts.push({
      id: "harvest",
      kind: "harvest",
      word: "Harvest early",
      sentence: `${input.harvest.message} ${input.harvest.rainMm} mm of rain is forecast in the next ${input.harvest.days} days for ${crops}.`,
      href: "/weather",
      action: "Open weather",
      priority: PRIORITY.harvest,
      tone: "warning",
    });
  }

  if (input.weatherError) {
    alerts.push({
      id: "weather",
      kind: "weather",
      word: "Weather unavailable",
      sentence: `${input.weatherError} The harvest warning cannot be checked until it is back.`,
      href: "/weather",
      action: "Open weather",
      priority: PRIORITY.weather,
      tone: "danger",
    });
  }

  for (const cropInput of input.crops) {
    const label = cropLabel(cropInput.crop);
    const base = {
      id: `decision-${cropInput.crop}`,
      kind: "decision" as const,
      href: `/crop/${cropInput.crop}`,
      action: `Open ${label}`,
    };

    if (cropInput.status === "SELL_NOW") {
      alerts.push({
        ...base,
        word: "Sell now",
        sentence: `${label}: ${cropInput.message}`,
        priority: PRIORITY.sellNow,
        tone: "success",
      });
    } else if (cropInput.status === "HOLD") {
      alerts.push({
        ...base,
        word: "Hold",
        sentence: `${label}: ${cropInput.message}`,
        priority: PRIORITY.hold,
        tone: "warning",
      });
    } else {
      alerts.push({
        ...base,
        word: "Not enough price history",
        sentence: `There is not yet a week of prices for ${label}, so the app has no answer for it. The rest of your farm is still decided.`,
        priority: PRIORITY.needData,
        tone: "muted",
      });
    }
  }

  const missingCosts = input.crops.filter((cropInput) => cropInput.costsNotSet);
  if (missingCosts.length > 0) {
    const names = listWords(missingCosts.map((cropInput) => cropLabel(cropInput.crop)));
    alerts.push({
      id: "costs",
      kind: "costs",
      word: "Costs not set",
      sentence: `Storage and spoilage count as nothing for ${names}, so holding may look cheaper than it is. Set the cost of waiting for each crop.`,
      href: "/costs",
      action: "Set costs",
      priority: PRIORITY.costs,
      tone: "info",
    });
  }

  return alerts.sort((a, b) => a.priority - b.priority);
}

/**
 * The DEMO_MODE preview (step 1 of the final push): the same harvest warning
 * the real alert would show, built from nothing — it reads no data and writes
 * none, and the page marks it "Demo preview".
 */
export const DEMO_HARVEST_PREVIEW: TodayAlert = {
  id: "demo-harvest",
  kind: "harvest",
  word: "Harvest early",
  sentence:
    "Heavy rain coming. Harvest or cover the crop early. This is a preview for the demo — no data was changed.",
  href: "/weather",
  action: "Open weather",
  priority: PRIORITY.harvest,
  tone: "warning",
  demo: true,
};
