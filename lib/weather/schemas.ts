import { z } from "zod";

/**
 * Response validation for every weather call (docs/00-global.md §3:
 * "validate the response with Zod; reject anything unexpected").
 * Shapes follow the official docs:
 * - Open-Meteo: https://open-meteo.com/en/docs  (read 18 Oct 2026)
 * - OpenWeatherMap 5 day / 3 hour: https://openweathermap.org/api/forecast5
 */

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * Open-Meteo forecast API, `current=` and `daily=` parameters.
 * Units by default: temperature °C, wind km/h, precipitation mm, probability %.
 * daily arrays are index-aligned with daily.time. The docs do not promise
 * precipitation_probability_max is ever null, but the field is not guaranteed
 * either, so a null is accepted and read as 0 rather than failing the card.
 */
export const openMeteoResponseSchema = z.object({
  current: z.object({
    temperature_2m: z.number(),
    relative_humidity_2m: z.number(),
    wind_speed_10m: z.number(),
    weather_code: z.number(),
  }),
  daily: z.object({
    time: z.array(dateOnly).min(1),
    weather_code: z.array(z.number()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    precipitation_sum: z.array(z.number()),
    precipitation_probability_max: z.array(z.number().nullable()),
  }),
});

export type OpenMeteoResponse = z.infer<typeof openMeteoResponseSchema>;

/**
 * OpenWeatherMap 5 day / 3 hour forecast, one element of `list`.
 * With units=metric temperatures are °C; `pop` stays a fraction 0..1;
 * rain/snow hold "3h" amounts in mm and may be missing entirely.
 */
export const openWeatherMapResponseSchema = z.object({
  city: z.object({ timezone: z.number() }),
  list: z
    .array(
      z.object({
        dt: z.number(),
        dt_txt: z.string(),
        main: z.object({
          temp: z.number(),
          temp_min: z.number(),
          temp_max: z.number(),
          humidity: z.number(),
        }),
        weather: z
          .array(z.object({ id: z.number(), description: z.string().min(1) }))
          .min(1),
        pop: z.number().min(0).max(1),
        wind: z.object({ speed: z.number() }),
        rain: z.object({ "3h": z.number() }).optional(),
        snow: z.object({ "3h": z.number() }).optional(),
      }),
    )
    .min(1),
});

export type OpenWeatherMapResponse = z.infer<typeof openWeatherMapResponseSchema>;

/** A stored WeatherSnapshot payload — what the fallback accepts as "saved data". */
export const weatherDataSchema = z.object({
  current: z.object({
    tempC: z.number(),
    humidity: z.number(),
    windKmh: z.number(),
    text: z.string().min(1),
  }),
  daily: z
    .array(
      z.object({
        date: dateOnly,
        minC: z.number(),
        maxC: z.number(),
        rainMm: z.number(),
        rainChancePct: z.number(),
      }),
    )
    .min(1),
  fetchedAt: z.string().datetime(),
  source: z.enum(["OPEN_METEO", "OPEN_WEATHER_MAP"]),
});
