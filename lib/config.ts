// App-wide settings (docs/00-global.md §2, §3).
// Anything a reviewer may want to tune lives here, not inside a function.

/** All dates and times are computed in this zone, never the server's clock zone. */
export const APP_TZ = process.env.APP_TZ || "Africa/Lagos";

export const WEATHER = {
  /** Cached snapshots younger than this are served without calling the API. */
  cacheMinutes: 30,
  /** Hard limit for one HTTP call. */
  timeoutMs: 5000,
  /** Attempts per request: 1 means one retry. */
  retries: 1,
  thresholds: {
    /** heat alert: day is hot at or above this */
    heatMaxC: 34,
    /** heavy rain alert: this many mm or more inside the window below */
    heavyRainMm: 20,
    /** window for the heavy rain alert, in days */
    heavyRainDays: 3,
    /** damp alert: humidity at or above this */
    dampHumidityPct: 80,
  },
} as const;

export const MARKET = {
  /** Generator day one. Prices are derived from this date, not from the clock. */
  startDate: "2026-01-01",
  /** History requests are capped here (docs/00-global.md §3). */
  maxHistoryDays: 90,
  defaultHistoryDays: 30,
  /** Window used for trend decisions. */
  trendDays: 14,
  /** Hard limit for one call to a real feed behind MARKET_API_URL. */
  liveTimeoutMs: 5000,
} as const;

/** Default farm coordinates: Port Harcourt (docs/00-global.md §3). */
export const DEFAULT_FARM = {
  lat: 4.8156,
  lon: 7.0498,
} as const;

export function isValidLat(lat: number): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

export function isValidLon(lon: number): boolean {
  return Number.isFinite(lon) && lon >= -180 && lon <= 180;
}
