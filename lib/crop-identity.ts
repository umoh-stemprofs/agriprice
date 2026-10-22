import type { Crop } from "@prisma/client";
import { catalogFor } from "@/lib/market/catalog";

/**
 * Crop identity for the redesign (stitch_agropulse_analytics_dashboard).
 *
 * Every screen in the design leads a card with two things: a tinted tile
 * holding a symbol, and a short subtitle under the crop name. This module is
 * the single place both come from, so no crop anywhere in the app can render
 * an empty tile or a blank subtitle.
 *
 * `tone` drives the tile colours. The design only ships four tints, so every
 * crop is mapped onto one of them rather than inventing new ones.
 */

export type CropTone = "amber" | "leaf" | "sky" | "warn";

interface CropIdentity {
  /** Screen symbol, e.g. "🌽". */
  emoji: string;
  /** Short subtitle under the crop name, e.g. "Most Common Crop". */
  subtitle: string;
  tone: CropTone;
}

const IDENTITY: Record<Crop, CropIdentity> = {
  MAIZE: { emoji: "🌽", subtitle: "Most Common Crop", tone: "amber" },
  CASSAVA: { emoji: "🍠", subtitle: "Staple Root Harvest", tone: "amber" },
  YAM: { emoji: "🌰", subtitle: "Tubers & Roots", tone: "amber" },
  RICE_PADDY: { emoji: "🌾", subtitle: "Unmilled Paddy", tone: "leaf" },
  TOMATO: { emoji: "🍅", subtitle: "Fresh Market Produce", tone: "warn" },
  TILAPIA: { emoji: "🐟", subtitle: "Fresh Pond Fish", tone: "sky" },
  CATFISH: { emoji: "🐠", subtitle: "Fresh Pond Fish", tone: "sky" },
  EGGS_TRAY: { emoji: "🥚", subtitle: "Layer Farm Produce", tone: "warn" },
  PALM_OIL: { emoji: "🫒", subtitle: "Virgin Red Oil", tone: "warn" },
};

/**
 * Identity for a crop the catalog knows.
 * Falls back for an unknown crop rather than throwing, because this is used
 * in card headers where a crash would take the whole page down.
 */
export function cropIdentity(crop: Crop): CropIdentity {
  const known = IDENTITY[crop];
  if (known) return known;

  const label = (() => {
    try {
      return catalogFor(crop).label;
    } catch {
      return crop;
    }
  })();

  return { emoji: "🌱", subtitle: label, tone: "leaf" };
}

/** Tailwind classes for a crop tile, so the tint lives in one place. */
export function tileClasses(tone: CropTone): string {
  switch (tone) {
    case "amber":
      return "bg-amber-100 text-amber-800";
    case "sky":
      return "bg-sky-100 text-sky-700";
    case "warn":
      return "bg-warn-bg text-warn-text";
    case "leaf":
    default:
      return "bg-leaf-100 text-leaf-800";
  }
}
