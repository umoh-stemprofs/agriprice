import { describe, expect, it, vi } from "vitest";
import type { WeatherData } from "./types";
import { getWeather, type WeatherDeps } from "./provider";

/**
 * Provider fallback (docs/00-global.md §3, tests list):
 * "mock fetch failure -> Saved data badge".
 * getWeather takes its side effects as dependencies, so this runs offline and
 * without a database.
 */

const NOW = () => new Date("2026-10-18T12:00:00.000Z");

function makeData(fetchedAt: string): WeatherData {
  return {
    current: { tempC: 28.4, humidity: 84, windKmh: 11.2, text: "Partly cloudy" },
    daily: [
      { date: "2026-10-18", minC: 24, maxC: 31, rainMm: 4.2, rainChancePct: 60 },
      { date: "2026-10-19", minC: 24, maxC: 30, rainMm: 0, rainChancePct: 20 },
    ],
    fetchedAt,
    source: "OPEN_METEO",
  };
}

const failingFetch = () => Promise.reject(new Error("network down"));

describe("getWeather fallback", () => {
  it("returns Saved data from the last snapshot when the fetch fails", async () => {
    const stored = makeData("2026-10-18T06:00:00.000Z"); // 6 h old
    const deps: WeatherDeps = {
      fetchWeather: failingFetch,
      loadSnapshot: async () => stored,
      now: NOW,
    };

    const result = await getWeather(4.8156, 7.0498, deps);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.badge).toBe("saved");
    expect(result.data.fetchedAt).toBe(stored.fetchedAt);
    expect(result.data.source).toBe("OPEN_METEO");
  });

  it("returns an error the page can show when there is no snapshot", async () => {
    const result = await getWeather(4.8156, 7.0498, {
      fetchWeather: failingFetch,
      loadSnapshot: async () => null,
      now: NOW,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/unavailable/i);
  });

  it("rejects a stored payload that does not match the schema", async () => {
    const result = await getWeather(4.8156, 7.0498, {
      fetchWeather: failingFetch,
      loadSnapshot: async () => ({ nonsense: true }),
      now: NOW,
    });

    expect(result.ok).toBe(false);
  });

  it("serves a fresh snapshot from cache without calling the provider", async () => {
    const stored = makeData("2026-10-18T11:50:00.000Z"); // 10 min old
    const fetchWeather = vi.fn(failingFetch);
    const saveSnapshot = vi.fn(async () => {});

    const result = await getWeather(4.8156, 7.0498, {
      fetchWeather,
      loadSnapshot: async () => stored,
      saveSnapshot,
      now: NOW,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.badge).toBe("live");
    expect(fetchWeather).not.toHaveBeenCalled();
    expect(saveSnapshot).not.toHaveBeenCalled();
  });

  it("stores and reports live data on a successful fetch", async () => {
    const fresh = makeData("2026-10-18T12:00:00.000Z");
    const saveSnapshot = vi.fn(async () => {});

    const result = await getWeather(4.8156, 7.0498, {
      fetchWeather: async () => fresh,
      loadSnapshot: async () => null,
      saveSnapshot,
      now: NOW,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.badge).toBe("live");
    expect(result.data).toEqual(fresh);
    expect(saveSnapshot).toHaveBeenCalledWith(fresh);
  });

  it("falls back to a stale snapshot when the refetch fails", async () => {
    const stale = makeData("2026-10-17T12:00:00.000Z"); // 24 h old, past the cache
    const result = await getWeather(4.8156, 7.0498, {
      fetchWeather: failingFetch,
      loadSnapshot: async () => stale,
      now: NOW,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.badge).toBe("saved");
    expect(result.data.fetchedAt).toBe(stale.fetchedAt);
  });
});
