import { describe, expect, it } from "vitest";
import {
  openMeteoResponseSchema,
  openWeatherMapResponseSchema,
  weatherDataSchema,
} from "./schemas";
import { toWeatherData as openMeteoToData, wmoText } from "./openMeteo";
import { localDateKey, toWeatherData as owmToData } from "./openWeatherMap";

/**
 * Shapes checked against the official docs (docs/00-global.md §3:
 * "verify both endpoint shapes against their docs"):
 * https://open-meteo.com/en/docs and https://openweathermap.org/api/forecast5
 * Field names and units below follow those pages.
 */

const openMeteoBody = {
  latitude: 4.75,
  longitude: 7.0,
  timezone: "Africa/Lagos",
  current_units: { temperature_2m: "°C", wind_speed_10m: "km/h" },
  current: {
    time: "2026-10-18T12:00",
    interval: 900,
    temperature_2m: 28.4,
    relative_humidity_2m: 84,
    wind_speed_10m: 11.2,
    weather_code: 2,
  },
  daily_units: { precipitation_sum: "mm", precipitation_probability_max: "%" },
  daily: {
    time: ["2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22"],
    weather_code: [2, 3, 61, 45, 80],
    temperature_2m_max: [31.2, 30.1, 28.4, 29.0, 30.5],
    temperature_2m_min: [24.1, 24.0, 23.5, 23.8, 24.2],
    precipitation_sum: [0, 0, 12.4, 0, 2.1],
    precipitation_probability_max: [10, 20, 90, null, 50],
  },
};

const owmBody = {
  cod: "200",
  message: 0,
  cnt: 40,
  city: { id: 2319086, name: "Port Harcourt", timezone: 3600, country: "NG" },
  list: [
    {
      // dt is UTC; city.timezone is a +3600 s offset, so these are 12:00,
      // 15:00 and 18:00 local on 2026-10-18 and 10:00 local on 2026-10-19.
      dt: 1792321200,
      dt_txt: "2026-10-18 11:00:00",
      main: { temp: 30.1, temp_min: 29.5, temp_max: 30.8, humidity: 80 },
      weather: [{ id: 801, main: "Clouds", description: "scattered clouds", icon: "03d" }],
      pop: 0.32,
      wind: { speed: 3.6, deg: 180 },
      rain: { "3h": 0.5 },
    },
    {
      dt: 1792332000,
      dt_txt: "2026-10-18 14:00:00",
      main: { temp: 31.0, temp_min: 30.0, temp_max: 31.5, humidity: 75 },
      weather: [{ id: 500, main: "Rain", description: "light rain", icon: "10d" }],
      pop: 0.6,
      wind: { speed: 4.1, deg: 190 },
      rain: { "3h": 2.4 },
    },
    {
      dt: 1792342800,
      dt_txt: "2026-10-18 17:00:00",
      main: { temp: 27.2, temp_min: 26.8, temp_max: 27.9, humidity: 88 },
      weather: [{ id: 501, main: "Rain", description: "moderate rain", icon: "10d" }],
      pop: 0.85,
      wind: { speed: 2.2, deg: 200 },
      rain: { "3h": 6.7 },
    },
    {
      dt: 1792400400,
      dt_txt: "2026-10-19 09:00:00",
      main: { temp: 29.0, temp_min: 28.2, temp_max: 29.6, humidity: 82 },
      weather: [{ id: 802, main: "Clouds", description: "scattered clouds", icon: "03d" }],
      pop: 0.15,
      wind: { speed: 3.0, deg: 175 },
    },
  ],
};

describe("Open-Meteo shape", () => {
  it("accepts the documented response", () => {
    const parsed = openMeteoResponseSchema.safeParse(openMeteoBody);
    expect(parsed.success).toBe(true);
  });

  it("rejects an unexpected response", () => {
    expect(openMeteoResponseSchema.safeParse({ current: {} }).success).toBe(false);
    expect(openMeteoResponseSchema.safeParse(null).success).toBe(false);
  });

  it("maps fields, units and WMO codes into our shape", () => {
    const data = openMeteoToData(openMeteoResponseSchema.parse(openMeteoBody));
    expect(data.source).toBe("OPEN_METEO");
    expect(data.current).toEqual({
      tempC: 28.4,
      humidity: 84,
      windKmh: 11.2,
      text: "Partly cloudy", // WMO code 2
    });
    expect(data.daily).toHaveLength(5);
    expect(data.daily[2]).toEqual({
      date: "2026-10-20",
      minC: 23.5,
      maxC: 28.4,
      rainMm: 12.4,
      rainChancePct: 90,
    });
    // a null probability is read as 0, not a crash
    expect(data.daily[3].rainChancePct).toBe(0);
  });

  it("maps unknown WMO codes to a safe label", () => {
    expect(wmoText(3)).toBe("Overcast");
    expect(wmoText(12345)).toBe("Unknown conditions");
  });
});

describe("OpenWeatherMap shape", () => {
  it("accepts the documented response", () => {
    expect(openWeatherMapResponseSchema.safeParse(owmBody).success).toBe(true);
  });

  it("rejects an unexpected response", () => {
    expect(openWeatherMapResponseSchema.safeParse({ list: [] }).success).toBe(false);
  });

  it("folds 3-hour steps into calendar days using the city offset", () => {
    const data = owmToData(openWeatherMapResponseSchema.parse(owmBody));
    expect(data.source).toBe("OPEN_WEATHER_MAP");
    expect(data.daily).toHaveLength(2);
    expect(data.daily[0]).toEqual({
      date: "2026-10-18",
      minC: 26.8,
      maxC: 31.5,
      rainMm: 9.6, // 0.5 + 2.4 + 6.7
      rainChancePct: 85, // highest step, fraction -> percent
    });
    expect(data.daily[1].rainMm).toBe(0); // entry without rain
  });

  it("turns m/s into km/h and capitalises the description", () => {
    const data = owmToData(openWeatherMapResponseSchema.parse(owmBody));
    expect(data.current.tempC).toBe(30.1);
    expect(data.current.windKmh).toBe(13); // 3.6 m/s * 3.6
    expect(data.current.text).toBe("Scattered clouds");
  });

  it("computes local calendar days from the UTC offset", () => {
    expect(localDateKey(1792321200, 3600)).toBe("2026-10-18");
    expect(localDateKey(1792400400, 3600)).toBe("2026-10-19");
    expect(localDateKey(0, 0)).toBe("1970-01-01");
  });
});

describe("saved snapshot shape", () => {
  it("accepts data our own provider produced", () => {
    const data = openMeteoToData(openMeteoResponseSchema.parse(openMeteoBody));
    expect(weatherDataSchema.safeParse(data).success).toBe(true);
  });

  it("rejects a corrupted stored payload", () => {
    expect(weatherDataSchema.safeParse({ current: {} }).success).toBe(false);
  });
});
