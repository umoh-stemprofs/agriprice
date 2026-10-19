# Database schema (Postgres on Neon · Prisma)

Source of truth: `prisma/schema.prisma`. Migrations live in
`prisma/migrations/` and are applied with `npx prisma migrate deploy`.
Money is always **integer kobo** (₦1 = 100 kobo). Calendar dates use
`@db.Date`; timestamps are `timestamptz` and are read in `APP_TZ`
(Africa/Lagos), never in the server's clock zone.

## Enums

- **Crop** — MAIZE, CASSAVA, YAM, RICE_PADDY, TOMATO, TILAPIA, CATFISH, EGGS_TRAY, PALM_OIL
- **Unit** — KG, TRAY, LITRE (how that crop is priced)
- **PriceSource** — SIMULATED, LIVE (drives the data-source badge)

## Tables

### users — one row per farmer who signed up
| field | type | notes |
|---|---|---|
| id | string | cuid primary key |
| email | string | unique |
| name | string | shown in the shell |
| passHash | string | bcrypt, cost 10 — never plain text |
| createdAt | timestamptz | default now() |

Relations: `farms` → Farm (one farmer has one or more farms).

### farms — the farmer's place, used for weather and ownership
| field | type | notes |
|---|---|---|
| id | string | cuid primary key |
| userId | string | → users.id, cascade delete |
| name | string | shown in the shell |
| lat / lon | float | weather coordinates (default Port Harcourt) |
| currency | string | default "NGN" |
| createdAt | timestamptz | default now() |

Relations: `user` → User; owns `inventory`, `costSettings`, `weather`
snapshots. Index on `userId`.

### price_ticks — one price for one crop on one calendar day
| field | type | notes |
|---|---|---|
| id | string | cuid primary key |
| crop | Crop | enum |
| date | @db.Date | the market day |
| priceKobo | int | integer kobo |
| unit | Unit | KG / TRAY / LITRE |
| source | PriceSource | default SIMULATED |
| createdAt | timestamptz | default now() |

Unique `(crop, date)` — the deterministic generator can be re-run for the same
day without duplicating rows.

### weather_snapshots — cached weather, so "Saved data" works after a failed call
| field | type | notes |
|---|---|---|
| id | string | cuid primary key |
| farmId | string | → farms.id, cascade delete |
| fetchedAt | timestamptz | cache age is computed from this |
| source | string | OPEN_METEO / OPENWEATHERMAP |
| payload | Json | the validated weather response |

Index `(farmId, fetchedAt)`; a fresh window of 30 minutes is served without a
network call, and rows older than 3 days are dropped on save.

### inventory_items — stock a farm currently holds
| field | type | notes |
|---|---|---|
| id | string | cuid primary key |
| farmId | string | → farms.id, cascade delete |
| crop | Crop | one row per crop per farm |
| qtyKg | int | > 0 (CHECK constraint in the migration) |
| note | string? | optional, max 120 characters |
| createdAt | timestamptz | default now() |

Index on `farmId`. Estimated market value = `qtyKg × latest price`, computed
at the edge, never stored.

### cost_settings — AgriPrice's "cost of waiting", per crop (01-agriprice.md)
| field | type | notes |
|---|---|---|
| id | string | cuid primary key |
| farmId | string | → farms.id, cascade delete |
| crop | Crop | the crop this row is for |
| storageKoboPerKgPerWeek | int | default 0, CHECK ≥ 0 |
| spoilagePctPerWeek | float | default 0, CHECK 0–100 |
| minGainPct | float | default 2, CHECK 0–100 |

Unique `(farmId, crop)` — one answer per crop per farm, always scoped to the
signed-in farmer's farm.

## Range rules

The migration adds CHECK constraints (`qtyKg > 0`, `storageKoboPerKgPerWeek ≥
0`, `0–100` percentages), so a bad row cannot be written even by a script or
by hand; Zod validation on every server input is the first line of defence
before the database is ever reached.
