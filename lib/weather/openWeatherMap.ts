import { isValidLat, isValidLon } from "@/lib/config";
import { openWeatherMapResponseSchema, type OpenWeatherMapResponse } from "./schemas";
import type { DailyWeather, WeatherData } from "./types";

/**
 * OpenWeatherMap adapter — used only when OWM_API_KEY is set.
 * 5 day / 3 hour forecast, units=metric, shape verified against
 * https://openweathermap.org/api/forecast5 and
 * https://openweathermap.org/api/weather-data
 *
 * The feed returns 3-hour steps, so they are folded into one row per calendar
 * day (temperature range, total rain, chance of rain = highest step).
 */

const MAX_DAYS = 5;
const round1 = (value: number): number => Math.round(value * 10) / 10;

interface FetchOptions {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

export function openWeatherMapUrl(lat: number, lon: number, apiKey: string): string {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    units: "metric",
    appid: apiKey,
  });
  return `https://api.openweathermap.org/data/2.5/forecast?${params.toString()}`;
}

function assertCoords(lat: number, lon: number): void {
  if (!isValidLat(lat)) {
    throw new Error(`Latitude must be between -90 and 90. Received ${lat}.`);
  }
  if (!isValidLon(lon)) {
    throw new Error(`Longitude must be between -180 and 180. Received ${lon}.`);
  }
}

/** Calendar day of a Unix timestamp at the city's UTC offset, as YYYY-MM-DD. */
export function localDateKey(dtSeconds: number, tzOffsetSeconds: number): string {
  return new Date((dtSeconds + tzOffsetSeconds) * 1000).toISOString().slice(0, 10);
}

/** Turn a validated OpenWeatherMap response into our own shape. Exported for tests. */
export function toWeatherData(
  body: OpenWeatherMapResponse,
  fetchedAt = new Date(),
): WeatherData {
  const tz = body.city.timezone;
  const first = body.list[0];

  const byDay = new Map<string, DailyWeather>();
  for (const item of body.list) {
    const date = localDateKey(item.dt, tz);
    const existing = byDay.get(date);
    const rainMm = (item.rain?.["3h"] ?? 0) + (item.snow?.["3h"] ?? 0);
    const chance = Math.round(item.pop * 100);
    if (existing) {
      existing.minC = Math.min(existing.minC, round1(item.main.temp_min));
      existing.maxC = Math.max(existing.maxC, round1(item.main.temp_max));
      existing.rainMm = round1(existing.rainMm + rainMm);
      existing.rainChancePct = Math.max(existing.rainChancePct, chance);
    } else {
      byDay.set(date, {
        date,
        minC: round1(item.main.temp_min),
        maxC: round1(item.main.temp_max),
        rainMm: round1(rainMm),
        rainChancePct: chance,
      });
    }
    if (byDay.size > MAX_DAYS) break;
  }

  const daily = [...byDay.values()].slice(0, MAX_DAYS);
  if (daily.length === 0) {
    throw new Error("OpenWeatherMap returned no forecast days.");
  }

  return {
    current: {
      tempC: round1(first.main.temp),
      humidity: Math.round(first.main.humidity),
      windKmh: round1(first.wind.speed * 3.6), // m/s -> km/h
      text: first.weather[0].description.replace(/^./, (c) => c.toUpperCase()),
    },
    daily,
    fetchedAt: fetchedAt.toISOString(),
    source: "OPEN_WEATHER_MAP",
  };
}

export async function fetchOpenWeatherMap(
  lat: number,
  lon: number,
  apiKey: string,
  options: FetchOptions = {},
): Promise<WeatherData> {
  assertCoords(lat, lon);
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(openWeatherMapUrl(lat, lon, apiKey), {
    signal: options.signal,
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`OpenWeatherMap responded with HTTP ${response.status}.`);
  }
  const json: unknown = await response.json();
  const parsed = openWeatherMapResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `OpenWeatherMap returned an unexpected shape: ${parsed.error.issues[0]?.message ?? "unknown"}`,
    );
  }
  return toWeatherData(parsed.data);
}
