import { describe, expect, it } from "vitest";
import { Crop } from "@prisma/client";
import { buildTodayAlerts, DEMO_HARVEST_PREVIEW, type AlertCropInput } from "./today";
import type { HarvestAlert } from "@/lib/weather/alerts";

/**
 * Today's alerts (docs/01-agriprice.md page 8). Pure inputs, so this runs on
 * any day without a database or a network call.
 */

const HARVEST: HarvestAlert = {
  rainMm: 25,
  days: 3,
  crops: [Crop.MAIZE],
  message: "Heavy rain coming. Harvest or cover the crop early.",
};

function crop(overrides: Partial<AlertCropInput> & { crop: Crop }): AlertCropInput {
  return {
    status: "SELL_NOW",
    message: "Price is not going up.",
    costsNotSet: false,
    ...overrides,
  };
}

const NOTHING = { crops: [], harvest: null, weatherError: null } as const;

describe("buildTodayAlerts", () => {
  it("is empty for a farm with no stock, no rain and working weather", () => {
    expect(buildTodayAlerts(NOTHING)).toEqual([]);
  });

  it("leads with the harvest alert, then weather, then the crop decisions", () => {
    const alerts = buildTodayAlerts({
      crops: [crop({ crop: Crop.MAIZE, status: "HOLD", message: "Price is rising about 5% a week." })],
      harvest: HARVEST,
      weatherError: "Weather is unavailable right now.",
    });

    expect(alerts.map((alert) => alert.id)).toEqual([
      "harvest",
      "weather",
      "decision-MAIZE",
    ]);
    expect(alerts.every((alert) => alert.priority < 100)).toBe(true);
  });

  it("gives the harvest alert the crop it affects and one button", () => {
    const alerts = buildTodayAlerts({
      crops: [crop({ crop: Crop.MAIZE })],
      harvest: { ...HARVEST, crops: [Crop.MAIZE, Crop.RICE_PADDY] },
      weatherError: null,
    });

    const harvest = alerts.find((alert) => alert.id === "harvest");
    expect(harvest?.word).toBe("Harvest early");
    expect(harvest?.sentence).toContain("25 mm of rain");
    expect(harvest?.sentence).toContain("Maize and Rice (paddy)");
    expect(harvest?.href).toBe("/weather");
    expect(harvest?.action).toBe("Open weather");
  });

  it("turns each in-stock decision into one alert with the crop page as the button", () => {
    const alerts = buildTodayAlerts({
      crops: [
        crop({ crop: Crop.TOMATO, status: "SELL_NOW", message: "Waiting costs more than you would gain." }),
        crop({ crop: Crop.CATFISH, status: "HOLD", message: "Price is rising about 4.2% a week." }),
        crop({ crop: Crop.YAM, status: "NEED_DATA", message: "Not enough price history yet." }),
      ],
      harvest: null,
      weatherError: null,
    });

    expect(alerts.map((alert) => alert.id)).toEqual([
      "decision-TOMATO",
      "decision-CATFISH",
      "decision-YAM",
    ]);
    expect(alerts[0].word).toBe("Sell now");
    expect(alerts[0].sentence).toBe("Tomato: Waiting costs more than you would gain.");
    expect(alerts[0].href).toBe("/crop/TOMATO");
    expect(alerts[0].action).toBe("Open Tomato");
    expect(alerts[1].word).toBe("Hold");
    expect(alerts[2].word).toBe("Not enough price history");
  });

  it("reports missing costs once as a group, after the decisions", () => {
    const alerts = buildTodayAlerts({
      crops: [
        crop({ crop: Crop.MAIZE, costsNotSet: true }),
        crop({ crop: Crop.YAM, costsNotSet: true }),
        crop({ crop: Crop.TOMATO, costsNotSet: false }),
      ],
      harvest: null,
      weatherError: null,
    });

    const costs = alerts.filter((alert) => alert.kind === "costs");
    expect(costs).toHaveLength(1);
    expect(costs[0].sentence).toContain("Maize and Yam");
    expect(costs[0].sentence).not.toContain("Tomato");
    expect(costs[0].action).toBe("Set costs");
    expect(costs[0].href).toBe("/costs");
    expect(alerts[alerts.length - 1].id).toBe("costs");
  });

  it("lists three missing crops with commas and an and", () => {
    const alerts = buildTodayAlerts({
      crops: [
        crop({ crop: Crop.MAIZE, costsNotSet: true }),
        crop({ crop: Crop.YAM, costsNotSet: true }),
        crop({ crop: Crop.TOMATO, costsNotSet: true }),
      ],
      harvest: null,
      weatherError: null,
    });

    const costs = alerts.filter((alert) => alert.kind === "costs");
    expect(costs).toHaveLength(1);
    expect(costs[0].sentence).toContain("Maize, Yam and Tomato");
  });

  it("reports unavailable weather as its own alert", () => {
    const alerts = buildTodayAlerts({
      crops: [],
      harvest: null,
      weatherError: "Weather is unavailable right now.",
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].word).toBe("Weather unavailable");
    expect(alerts[0].sentence).toContain("harvest warning cannot be checked");
  });

  it("never gives a decision to a crop the farm does not hold", () => {
    // The caller only passes in-stock crops; this guards the contract itself.
    const alerts = buildTodayAlerts({ ...NOTHING, crops: [] });
    expect(alerts).toEqual([]);
  });
});

describe("DEMO_HARVEST_PREVIEW", () => {
  it("is marked as a demo and reads no data", () => {
    expect(DEMO_HARVEST_PREVIEW.demo).toBe(true);
    expect(DEMO_HARVEST_PREVIEW.id).toBe("demo-harvest");
    expect(DEMO_HARVEST_PREVIEW.word).toBe("Harvest early");
    expect(DEMO_HARVEST_PREVIEW.sentence).toContain("preview for the demo");
    expect(DEMO_HARVEST_PREVIEW.action).toBe("Open weather");
  });
});
