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

/**
 * Sell-now-or-hold logic (docs/01-agriprice.md, "Logic").
 * Sample numbers — an expert must review them before any real use.
 */
export const SELL_WINDOW = {
  /** Wait only if one week of holding would gain at least this much. */
  minGainPct: 2,
  /** The weekly trend is clamped to +/- this percent, so one wild week cannot decide alone. */
  trendClampPct: 20,
  /** Fewer than this many daily prices and there is nothing to decide with. */
  minPrices: 7,
} as const;

/** Login and session rules (docs/00-global.md §3). */
export const AUTH = {
  /** iron-session cookie name. */
  cookieName: "agriprice_session",
  /** How long a login lasts: 7 days. */
  maxAgeSeconds: 60 * 60 * 24 * 7,
  /** bcrypt work factor, fixed by the rules. */
  bcryptCost: 10,
  passwordMinLength: 8,
  nameMaxLength: 80,
  emailMaxLength: 160,
} as const;

/**
 * The seeded demo account, used by the "Try demo account" button.
 * The password lives in README.md only; the button signs in without it.
 */
export const DEMO = {
  email: "demo@agriprice.test",
  name: "Ada Okonkwo",
  farmName: "Port Harcourt farm",
} as const;

/** True only when DEMO_MODE="true" (checked on the server, never in the browser). */
export function demoModeEnabled(): boolean {
  return process.env.DEMO_MODE?.trim().toLowerCase() === "true";
}

/** A new farm starts at the default coordinates until Settings says otherwise. */
export const NEW_FARM_NAME = "My farm";

/** Stock rules. qtyKg is a whole number of kg, above 0. */
export const STOCK = {
  maxQtyKg: 1_000_000,
  noteMaxLength: 120,
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
