# AgriPrice — sell now or hold

Farm dashboard for the "Agro-Analytics" task. Per crop, it answers one question:
**sell now or hold**, using the price trend from the market feed minus the cost of
waiting, and shows what that choice is worth on the stock the farm owns.

Decision-support tool. You decide.

Status: **step 2 of 10 — market feed + weather provider.** Schema, seed,
routes, generator and both weather adapters are in place.

## Stack

Next.js 14 (App Router, TypeScript) · Tailwind · Prisma + Postgres · Recharts ·
Zod · iron-session · bcryptjs · date-fns-tz · Vitest. Accent `#1B7F3B`.

Money is stored as integer kobo (₦1 = 100 kobo) and formatted at the edge.
All dates and times use `APP_TZ` (default `Africa/Lagos`).

## Setup

```bash
npm install
cp .env.example .env      # then set DATABASE_URL
npm run db:migrate        # create the tables
npm run db:seed           # one farm, three crops of stock, their costs
npm run dev               # http://localhost:3000
```

`npm run typecheck` runs TypeScript, `npm test` runs the Vitest suite,
`npm run db:studio` opens Prisma Studio.

`npm run predev` / `npm run prebuild` (also run automatically before `dev`
and `build`) re-check that `lib/market/salts.json` still gives one rising and
one falling crop for today's date, and rewrite it only when it does not.
Run it directly with `npm run pick-salts`.

`npm run db:seed` is idempotent: re-running it converges on the same demo rows.

### Postgres

Any Postgres works locally; Neon free tier in deployment (`?sslmode=require`).
The plan is Postgres in dev as well as production, so no SQLite-only behaviour
sneaks in.

To reset everything: `npm run db:reset` (drops, re-migrates and re-seeds).

## Demo account

- Email: `demo@agriprice.test`
- Password: `demo1234`

Demo credentials live here, never in the app code.

## Data model (step 1)

| Model | Purpose |
|---|---|
| `User` | Farmer login (bcrypt cost 10) |
| `Farm` | Name, coordinates, currency; default Port Harcourt 4.8156, 7.0498 |
| `InventoryItem` | Stock per crop, `qtyKg > 0` |
| `CostSetting` | AgriPrice feature: storage ₦/kg/week, spoilage %/week, minimum gain % |
| `PriceTick` | Daily price per crop, unique per crop+date (step 2 fills it) |
| `WeatherSnapshot` | Cached weather, so an API failure still shows saved data (step 3) |

Enums: `Crop` (nine catalog crops), `Unit` (`KG`, `TRAY`, `LITRE`),
`PriceSource` (`SIMULATED`, `LIVE`).

Range rules are CHECK constraints in the migration, not just app checks:
latitude −90..90, longitude −180..180, price > 0, quantity > 0, storage and
minimum gain ≥ 0, spoilage 0..100.

## Seed contents

One demo farm with three crops and their cost of waiting:

| Crop | Stock | Storage | Spoilage | Wait only if gain |
|---|---|---|---|---|
| MAIZE | 1,200 kg | ₦2 / kg / week | 1% / week | ≥ 2% |
| CASSAVA | 600 kg | ₦1 / kg / week | 4% / week | ≥ 2% |
| TOMATO | 350 kg | ₦3 / kg / week | 12% / week | ≥ 3% |

These numbers are placeholders. An expert must review them before any real use.

## Market feed and weather (step 2)

- **Routes:** `GET /api/market/prices`, `GET /api/market/history?crop=&days=`
  (1–90), `GET /api/weather`. Every response is `{crop, date, priceKobo,
  unit, source}` for prices, validated with Zod.
- **Generator:** deterministic per (crop, salt, day), `START_DATE 2026-01-01`,
  drift clamped to ±35%, price = round(base × exp(x)). Salts live in
  `lib/market/salts.json` and are picked by `scripts/pick-salts.ts`.
- **Adapter:** `MarketProvider` — `SimulatedProvider` by default; setting
  `MARKET_API_URL` switches to `LiveProvider`, which falls back to the
  simulated feed on any failure (the badge then says "Simulated").
- **Weather:** Open-Meteo by default, OpenWeatherMap when `OWM_API_KEY` is
  set. Server-only, 5 s timeout, one retry, 30-minute `WeatherSnapshot`
  cache; on failure the last snapshot shows with "Saved data", otherwise an
  error card with Retry. Harvest alert: ≥ 20 mm rain in 3 days for maize and
  rice paddy (`lib/weather/alerts.ts`, tested).
- **Docs:** `docs/api.md` (every external call), `docs/real-price-sources.md`
  (research on real price sources — nothing wired).

## Next steps

4. `sellWindow.ts` + tests · 5. Inventory + estimated market value ·
6. Dashboard + charts · 7. Crop detail + costs · 8. Alerts · 9. Responsive check ·
10. Full click-through.
