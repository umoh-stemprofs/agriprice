# API documentation (docs/00-global.md §3 — required for the report)

Every external call AgriPrice makes, its URL pattern, key name and a sample
response. Nothing here is called from the browser: weather and market calls
run on the server only. Verified against the code on 2026-10-19.

Badges shown next to these sources: **Live** (green dot) for a working
external fetch · **Saved data** (amber clock) for the stored weather snapshot
after a failed call · **Simulated** (blue flask) for the generated price feed.

## 1. Weather — Open-Meteo (default, no key)

| | |
|---|---|
| Used when | `OWM_API_KEY` is not set (the default) |
| URL pattern | `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=Africa%2FLagos&forecast_days=5` |
| Key | none |
| Docs | https://open-meteo.com/en/docs |
| Timeout / retry | 5 s per attempt, 1 retry (`WEATHER` in `lib/config.ts`) |

Sample response (shape only):

```json
{
  "current": { "temperature_2m": 28.4, "relative_humidity_2m": 84,
               "wind_speed_10m": 11.2, "weather_code": 2 },
  "daily": {
    "time": ["2026-10-18", "..."],
    "weather_code": [2, "..."],
    "temperature_2m_max": [31.2, "..."],
    "temperature_2m_min": [24.1, "..."],
    "precipitation_sum": [0, "..."],
    "precipitation_probability_max": [10, "..."]
  }
}
```

Units by default: temperature °C, wind km/h, precipitation mm, probability %.
`weather_code` is a WMO code; the text shown on screen comes from the mapping
in `lib/weather/openMeteo.ts`. Validated with `openMeteoResponseSchema`.

## 2. Weather — OpenWeatherMap (optional)

| | |
|---|---|
| Used when | `OWM_API_KEY` is set |
| URL pattern | `https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&units=metric&appid={OWM_API_KEY}` |
| Key | `OWM_API_KEY` (environment variable only, never committed) |
| Docs | https://openweathermap.org/api/forecast5 |
| Timeout / retry | 5 s per attempt, 1 retry |

The feed returns 3-hour steps; they are folded into one row per calendar day
(min, max, total rain, highest chance). Sample element of `list`:

```json
{
  "dt": 1792321200,
  "dt_txt": "2026-10-18 11:00:00",
  "main": { "temp": 30.1, "temp_min": 29.5, "temp_max": 30.8, "humidity": 80 },
  "weather": [{ "id": 801, "description": "scattered clouds" }],
  "pop": 0.32,
  "wind": { "speed": 3.6 },
  "rain": { "3h": 0.5 }
}
```

`units=metric` gives °C; `pop` is a fraction 0..1; `city.timezone` is a UTC
offset in seconds. Validated with `openWeatherMapResponseSchema`.

## 3. Real market feed (optional, not connected yet)

| | |
|---|---|
| Used when | `MARKET_API_URL` is set |
| Called | `{MARKET_API_URL}/prices?date=YYYY-MM-DD` and `{MARKET_API_URL}/history?crop=MAIZE&days=30&endDate=YYYY-MM-DD` |
| Key | none expected |
| On any failure | falls back to the simulated feed; the badge then says "Simulated" |

Expected response shape (same as our own routes), validated with Zod before
use:

```json
[{ "crop": "MAIZE", "date": "2026-10-18", "priceKobo": 61500,
   "unit": "KG", "source": "LIVE" }]
```

No real feed is wired today — see `docs/real-price-sources.md`.

## 4. Our own routes

### GET /api/market/prices

Latest price of every crop, from the provider above (simulated by default).
Plain array, `cache-control: no-store`. No session is required — these are
data feeds with no per-user information (middleware skips `/api`).

```json
[{ "crop": "MAIZE", "date": "2026-10-18", "priceKobo": 61500,
   "unit": "KG", "source": "SIMULATED" }]
```

### GET /api/market/history?crop=MAIZE&days=30

Daily prices for one crop, oldest first, `days` 1–90 (400 with a plain-English
error when `crop` is missing or out of range).

```json
[{ "crop": "MAIZE", "date": "2026-09-19", "priceKobo": 60210,
   "unit": "KG", "source": "SIMULATED" }]
```

### GET /api/weather

The farm's forecast, fetched server-side. 200 when usable, 503 when weather is
unavailable and there is no saved snapshot.

```json
{ "ok": true, "badge": "live",
  "data": { "current": { "tempC": 28.4, "humidity": 84, "windKmh": 11.2,
                         "text": "Partly cloudy" },
            "daily": [{ "date": "2026-10-18", "minC": 24.1, "maxC": 31.2,
                        "rainMm": 0, "rainChancePct": 10 }],
            "fetchedAt": "2026-10-18T11:00:00.000Z",
            "source": "OPEN_METEO" } }
```

Error (503): `{ "ok": false, "error": "Weather is unavailable right now. ..." }`

The endpoint takes no parameters. The weather **pages** always use the
signed-in farmer's own farm coordinates; this public demo route uses the
first farm in the database (`firstFarm()` in `lib/weather/provider.ts`) or,
when there is none, the default Port Harcourt coordinates.

## 5. Caching

Successful weather responses are stored in `WeatherSnapshot` (30 minute fresh
window, older than 3 days dropped on save). Inside the window the app serves
the stored row without a network call and the badge still reads "Live ·
updated N min ago"; after a failed call it serves the last stored row with
"Saved data · N h old".
