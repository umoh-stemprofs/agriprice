import { APP_TZ, isValidLat, isValidLon } from "@/lib/config";
import { openMeteoResponseSchema, type OpenMeteoResponse } from "./schemas";
import type { DailyWeather, WeatherData } from "./types";

/**
 * Open-Meteo adapter — the default provider, no API key needed.
 * Endpoint shape verified against https://open-meteo.com/en/docs
 * (current= and daily= parameters, timezone= for local calendar days).
 */

/** WMO weather codes, as listed in the Open-Meteo documentation. */
const WMO_TEXT: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snowfall",
  73: "Moderate snowfall",
  75: "Heavy snowfall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  97: "Heavy thunderstorm",
  99: "Thunderstorm with heavy hail",
};

export function wmoText(code: number): string {
  return WMO_TEXT[code] ?? "Unknown conditions";
}

const round1 = (value: number): number => Math.round(value * 10) / 10;

export function openMeteoUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
    timezone: APP_TZ,
    forecast_days: "5",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

interface FetchOptions {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

function assertCoords(lat: number, lon: number): void {
  if (!isValidLat(lat)) {
    throw new Error(`Latitude must be between -90 and 90. Received ${lat}.`);
  }
  if (!isValidLon(lon)) {
    throw new Error(`Longitude must be between -180 and 180. Received ${lon}.`);
  }
}

/** Turn a validated Open-Meteo response into our own shape. Exported for tests. */
export function toWeatherData(body: OpenMeteoResponse, fetchedAt = new Date()): WeatherData {
  const { daily } = body;
  const length = Math.min(daily.time.length, 5);
  const days: DailyWeather[] = [];
  for (let i = 0; i < length; i++) {
    // Every daily array must line up with time; a mismatch means a changed API.
    const max = daily.temperature_2m_max[i];
    const min = daily.temperature_2m_min[i];
    const rain = daily.precipitation_sum[i];
    const code = daily.weather_code[i];
    if (
      max === undefined ||
      min === undefined ||
      rain === undefined ||
      code === undefined ||
      !Number.isFinite(max + min + rain + code)
    ) {
      throw new Error("Open-Meteo daily arrays do not line up with daily.time.");
    }
    days.push({
      date: daily.time[i],
      minC: round1(min),
      maxC: round1(max),
      rainMm: round1(rain),
      rainChancePct: Math.round(daily.precipitation_probability_max[i] ?? 0),
    });
  }
  if (days.length === 0) {
    throw new Error("Open-Meteo returned no daily forecast days.");
  }

  return {
    current: {
      tempC: round1(body.current.temperature_2m),
      humidity: Math.round(body.current.relative_humidity_2m),
      windKmh: round1(body.current.wind_speed_10m),
      text: wmoText(body.current.weather_code),
    },
    daily: days,
    fetchedAt: fetchedAt.toISOString(),
    source: "OPEN_METEO",
  };
}

export async function fetchOpenMeteo(
  lat: number,
  lon: number,
  options: FetchOptions = {},
): Promise<WeatherData> {
  assertCoords(lat, lon);
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(openMeteoUrl(lat, lon), {
    signal: options.signal,
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Open-Meteo responded with HTTP ${response.status}.`);
  }
  const json: unknown = await response.json();
  const parsed = openMeteoResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Open-Meteo returned an unexpected shape: ${parsed.error.issues[0]?.message ?? "unknown"}`,
    );
  }
  return toWeatherData(parsed.data);
}
