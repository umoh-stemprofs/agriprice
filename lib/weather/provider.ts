import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { DEFAULT_FARM, isValidLat, isValidLon, WEATHER } from "@/lib/config";
import { fetchOpenMeteo } from "./openMeteo";
import { fetchOpenWeatherMap } from "./openWeatherMap";
import { weatherDataSchema } from "./schemas";
import type { WeatherData, WeatherResult } from "./types";

/**
 * Weather orchestration (docs/00-global.md §3):
 * - Open-Meteo by default; OpenWeatherMap only when OWM_API_KEY is set.
 * - Server only. Timeout 5 s per attempt, one retry.
 * - Fresh WeatherSnapshot (under 30 min) is served without a network call.
 * - If the call fails: last stored snapshot with the "Saved data" badge.
 * - If there is no stored snapshot either: an error the page can show, and
 *   the rest of the app keeps working.
 *
 * Every side effect is injectable, which is how the fallback test runs
 * without a network or a database.
 */

export interface WeatherDeps {
  /**
   * The farm this weather belongs to. When null (the farm lookup failed, for
   * example because the database is slow) the forecast is still fetched with
   * the default coordinates, but nothing is read from or written to the cache.
   */
  farmId?: string | null;
  /** The provider call (timeout + retry applied around it). */
  fetchWeather?: (lat: number, lon: number) => Promise<WeatherData>;
  /** Latest stored snapshot payload, or null when there is none. */
  loadSnapshot?: () => Promise<unknown | null>;
  /** Persist a successful fetch. */
  saveSnapshot?: (data: WeatherData) => Promise<void>;
  now?: () => Date;
}

/**
 * The first farm, used by the public GET /api/weather demo route so it has a
 * snapshot to read. Pages always use the signed-in farmer's farm instead.
 */
export async function firstFarm(): Promise<{
  id: string;
  lat: number;
  lon: number;
} | null> {
  try {
    const farm = await db.farm.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true, lat: true, lon: true },
    });
    if (!farm) return null;
    if (!isValidLat(farm.lat) || !isValidLon(farm.lon)) return null;
    return farm;
  } catch (error) {
    console.warn("Could not read farm location:", error instanceof Error ? error.message : error);
    return null;
  }
}

async function defaultLoadSnapshot(farmId: string): Promise<unknown | null> {
  try {
    const snapshot = await db.weatherSnapshot.findFirst({
      where: { farmId },
      orderBy: { fetchedAt: "desc" },
      select: { payload: true },
    });
    return snapshot?.payload ?? null;
  } catch (error) {
    console.warn("Could not read weather snapshot:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Keep snapshots bounded: anything older than 3 days is dropped on save. */
async function defaultSaveSnapshot(farmId: string, data: WeatherData): Promise<void> {
  try {
    const fetchedAt = new Date(data.fetchedAt);
    await db.weatherSnapshot.create({
      data: {
        farmId,
        fetchedAt,
        source: data.source,
        payload: data as unknown as Prisma.InputJsonValue,
      },
    });
    await db.weatherSnapshot.deleteMany({
      where: { farmId, fetchedAt: { lt: new Date(fetchedAt.getTime() - 3 * 24 * 60 * 60 * 1000) } },
    });
  } catch (error) {
    // A cache problem must never take the weather card down.
    console.warn("Could not store weather snapshot:", error instanceof Error ? error.message : error);
  }
}

/**
 * One provider call: OpenWeatherMap if OWM_API_KEY is set, otherwise
 * Open-Meteo. Each attempt gets its own 5 s timeout; WEATHER.retries (1)
 * retries after a failure.
 */
async function callProvider(lat: number, lon: number): Promise<WeatherData> {
  const apiKey = process.env.OWM_API_KEY?.trim();
  let lastError: unknown = new Error("Weather provider was never called.");
  for (let attempt = 0; attempt <= WEATHER.retries; attempt++) {
    try {
      const signal = AbortSignal.timeout(WEATHER.timeoutMs);
      const data = apiKey
        ? await fetchOpenWeatherMap(lat, lon, apiKey, { signal })
        : await fetchOpenMeteo(lat, lon, { signal });
      return data;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function ageMinutes(fetchedAt: string, now: Date): number {
  const time = Date.parse(fetchedAt);
  if (Number.isNaN(time)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now.getTime() - time) / 60000);
}

/**
 * The page's single entry point. Returns either usable data (with a badge
 * saying where it came from) or an error message — never throws.
 */
export async function getWeather(
  lat: number = DEFAULT_FARM.lat,
  lon: number = DEFAULT_FARM.lon,
  deps: WeatherDeps = {},
): Promise<WeatherResult> {
  const now = deps.now ?? (() => new Date());
  const farmId = deps.farmId ?? null;
  const run = deps.fetchWeather ?? callProvider;

  // No farm means no place to keep a snapshot. The forecast below still works.
  const load =
    deps.loadSnapshot ?? (farmId ? () => defaultLoadSnapshot(farmId) : async () => null);
  const save =
    deps.saveSnapshot ?? (farmId ? (data: WeatherData) => defaultSaveSnapshot(farmId, data) : async () => {});

  let stored: unknown = null;
  try {
    stored = await load();
  } catch (error) {
    console.warn("Could not load weather snapshot:", error instanceof Error ? error.message : error);
  }
  const cached = stored === null ? null : weatherDataSchema.safeParse(stored);

  // Fresh cache: under WEATHER.cacheMinutes, no network call needed.
  if (cached?.success && ageMinutes(cached.data.fetchedAt, now()) < WEATHER.cacheMinutes) {
    return { ok: true, data: cached.data, badge: "live" };
  }

  try {
    const data = await run(lat, lon);
    if (farmId) {
      await save(data);
    }
    return { ok: true, data, badge: "live" };
  } catch (error) {
    console.warn(
      "Weather call failed:",
      error instanceof Error ? error.message : error,
    );
    if (cached?.success) {
      return { ok: true, data: cached.data, badge: "saved" };
    }
    return {
      ok: false,
      error: "Weather is unavailable right now. Check the connection and try again.",
    };
  }
}
