import { describe, expect, it } from "vitest";
import { PriceSource } from "@prisma/client";
import { LiveProvider, SimulatedProvider, marketProvider } from "./provider";

/**
 * MarketProvider adapter (docs/00-global.md §3): LiveProvider falls back to
 * the simulated feed on any failure, and the badge then says "Simulated".
 */

const TODAY = "2026-10-18";
const okJson = (body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }),
  );

describe("SimulatedProvider", () => {
  it("is the default when MARKET_API_URL is not set", () => {
    const previous = process.env.MARKET_API_URL;
    delete process.env.MARKET_API_URL;
    try {
      expect(marketProvider()).toBeInstanceOf(SimulatedProvider);
    } finally {
      if (previous !== undefined) process.env.MARKET_API_URL = previous;
    }
  });

  it("returns every crop with the Simulated badge", async () => {
    const result = await new SimulatedProvider().latestPrices(TODAY);
    expect(result.label).toBe("Simulated");
    expect(result.source).toBe(PriceSource.SIMULATED);
    expect(result.ticks.length).toBeGreaterThanOrEqual(3);
    expect(result.ticks.every((t) => t.source === PriceSource.SIMULATED)).toBe(true);
  });
});

describe("LiveProvider", () => {
  it("uses the live feed when it answers with valid data", async () => {
    const fetchImpl = () =>
      okJson([
        { crop: "MAIZE", date: TODAY, priceKobo: 61500, unit: "KG", source: "LIVE" },
      ]);
    const provider = new LiveProvider("https://feed.example.com/api", fetchImpl as never);

    const result = await provider.latestPrices(TODAY);
    expect(result.label).toBe("Live");
    expect(result.source).toBe(PriceSource.LIVE);
    expect(result.ticks).toEqual([
      { crop: "MAIZE", date: TODAY, priceKobo: 61500, unit: "KG", source: "LIVE" },
    ]);
  });

  it("falls back to simulated when the fetch fails", async () => {
    const fetchImpl = () => Promise.reject(new Error("network down"));
    const provider = new LiveProvider("https://feed.example.com/api", fetchImpl as never);

    const result = await provider.latestPrices(TODAY);
    expect(result.label).toBe("Simulated");
    expect(result.source).toBe(PriceSource.SIMULATED);
    expect(result.ticks.length).toBeGreaterThanOrEqual(3);
  });

  it("falls back when the feed answers with a bad status", async () => {
    const fetchImpl = () => Promise.resolve(new Response("busy", { status: 503 }));
    const provider = new LiveProvider("https://feed.example.com/api", fetchImpl as never);

    const result = await provider.latestPrices(TODAY);
    expect(result.label).toBe("Simulated");
  });

  it("falls back when the feed answers with the wrong shape", async () => {
    const fetchImpl = () => okJson({ not: "a price list" });
    const provider = new LiveProvider("https://feed.example.com/api", fetchImpl as never);

    const result = await provider.latestPrices(TODAY);
    expect(result.label).toBe("Simulated");
    expect(result.ticks.length).toBeGreaterThanOrEqual(3);
  });

  it("falls back for history requests too", async () => {
    const fetchImpl = () => Promise.reject(new Error("down"));
    const provider = new LiveProvider("https://feed.example.com/api", fetchImpl as never);

    const result = await provider.history("MAIZE" as never, TODAY, 14);
    expect(result.label).toBe("Simulated");
    expect(result.ticks).toHaveLength(14);
  });
});
