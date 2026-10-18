/**
 * The one weather shape every part of the app sees (docs/00-global.md §3).
 * Adapters turn their provider's response into this; nothing else in the app
 * knows what Open-Meteo or OpenWeatherMap return.
 */

export type WeatherSource = "OPEN_METEO" | "OPEN_WEATHER_MAP";

/** Badge shown on the card: fresh data ("Live") or a stored one ("Saved data"). */
export type WeatherBadge = "live" | "saved";

export interface CurrentWeather {
  tempC: number;
  humidity: number;
  windKmh: number;
  /** Provider description, e.g. "Partly cloudy". */
  text: string;
}

export interface DailyWeather {
  /** YYYY-MM-DD in APP_TZ. */
  date: string;
  minC: number;
  maxC: number;
  rainMm: number;
  /** 0-100. */
  rainChancePct: number;
}

export interface WeatherData {
  current: CurrentWeather;
  /** Up to 5 days, oldest first. */
  daily: DailyWeather[];
  /** ISO timestamp of when this data was fetched. */
  fetchedAt: string;
  source: WeatherSource;
}

export type WeatherResult =
  | { ok: true; data: WeatherData; badge: WeatherBadge }
  | { ok: false; error: string };
