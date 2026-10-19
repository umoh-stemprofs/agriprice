# AgriPrice — sell now or hold

Farm dashboard for the "Agro-Analytics" task. Per crop, it answers one question:
**sell now or hold**, using the price trend from the market feed minus the cost of
waiting, and shows what that choice is worth on the stock the farm owns.

Decision-support tool. You decide.

Status: **step 4B — crop detail, the cost form and the charts.**
Auth, the dashboard shell, stock, market, weather and settings are in place.
What is left: the alerts page (8), the full responsive check (9) and the
report + demo video (10).

## Stack

Next.js 14 (App Router, TypeScript) · Tailwind · Prisma + Postgres · Recharts ·
Zod · iron-session · bcryptjs · date-fns-tz · Vitest. Accent `#1B7F3B`.

Money is stored as integer kobo (₦1 = 100 kobo) and formatted at the edge.
All dates and times use `APP_TZ` (default `Africa/Lagos`).

## Setup

```bash
npm install
cp .env.example .env      # then set DATABASE_URL and SESSION_SECRET
npm run db:migrate        # create the tables
npm run db:seed           # one farm, three crops of stock, their costs
npm run dev               # http://localhost:3000
```

`SESSION_SECRET` encrypts the login cookie and must be at least 32 characters.
Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`DEMO_MODE="true"` shows the "Try demo account" button on the login page. Set it
to anything else on a public deployment.

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

Demo credentials live here, never in the app code. With `DEMO_MODE="true"` the
login page also has a "Try demo account" button, which opens the same farm
without typing the password.

## Data model (step 1)

| Model | Purpose |
|---|---|
| `User` | Farmer login (bcrypt cost 10) |
| `Farm` | Name, coordinates, currency; default Port Harcourt 4.8156, 7.0498 |
| `InventoryItem` | Stock per crop, `qtyKg > 0` |
| `CostSetting` | AgriPrice feature: storage ₦/kg/week, spoilage %/week, minimum gain % |
| `PriceTick` | Daily price per crop, unique per crop+date (step 2 fills it) |
| `WeatherSnapshot` | Cached weather, so an API failure still shows saved data (step 3) |

Seeded stock: MAIZE 1,200 kg · CASSAVA 600 kg · TOMATO 350 kg · CATFISH 120 kg.
Catfish is the demo "Hold" crop: it rises today and has **no** cost row, so the
dashboard shows the Hold pill next to the "Set costs" link; the other three pay
storage and spoilage and read "Sell now". Re-running `npm run db:seed` on a day
when the picked salts have catfish falling flips the two states — the salts are
re-checked by `npm run pick-salts` on every dev/build.

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

## Login, pages and protection (step 4A)

- **Auth:** `iron-session` cookie (`agriprice_session`, httpOnly, sameSite=lax,
  `secure` in production) plus `bcryptjs` at cost 10. Signup asks for a name, an
  email and a password of at least 8 characters; the farm is created in the same
  write. Login answers a wrong email or password with one sentence and never
  says which half was wrong. Every form input is parsed with Zod on the server
  (`lib/auth/validation.ts`).
- **Protection:** `middleware.ts` redirects signed-out visitors to
  `/login?next=…` for every page except `/login` and `/signup`. Every server
  action re-checks the session and resolves that farmer's farm; stock reads,
  edits and deletes are filtered by `farm: { userId }`, so another farmer's row
  is never found (`lib/stock/service.ts`). A farm lookup that fails (slow
  database) still leaves the weather working on the default coordinates, and
  skips storing a snapshot.
- **Shell:** 240 px sidebar + grid from 1024 px, top bar + links from 640 px,
  top bar + 4-item bottom nav below that (`components/AppShell.tsx`). Nav:
  Dashboard, Stock, Market, Weather, Settings.
- **Dashboard:** four stat cards, a "Sell or hold" list per crop (today's price,
  Sell now / Hold pill with icon and word, the one sentence from `sellWindow`,
  the money at stake, `Set costs` when costs are missing), the weather card and
  the harvest alert banner — every data card keeps its Live / Saved / Simulated
  badge. Footer: "Decision-support tool. You decide."
- **Stock:** estimated market value (kg × latest price, integer kobo) with a
  total card, a table on desktop and cards on phone, add / edit / delete with a
  confirm dialog. Adding a crop you already hold tops that row up.
- **Market / weather / settings:** a price card per crop with the change since
  yesterday; the 5-day forecast with the harvest alert; farm name, latitude and
  longitude with a "Use my location" button (lat −90..90, lon −180..180).

## Crop detail, costs and charts (step 4B)

- **Crop detail** (`/crop/MAIZE`): big status pill, the one sentence, the money
  line (including the extra "but less than your minimum gain" line), a 30-day
  line chart with the next week as a dotted line, and three cards — weekly
  trend, cost of waiting per kg, value of your stock — plus a "Set costs"
  button. Linked from the dashboard list and the market cards.
- **Costs** (`/costs?crop=…`): storage per kg per week in naira, spoilage %
  and minimum gain %, validated on the server (≥ 0, 0–100, ≥ 0) and saved to
  `CostSetting` for the signed-in farm only. The preview card runs the same
  `sellWindow` on the same prices while you type and never writes anything —
  only "Save costs" posts.
- **Charts (Recharts):** dashboard bar "Stock value by crop" and pie "Share of
  stock value" (max 5 slices, the tail as "Other"); market line chart per crop
  with a 7 / 30 / 90-day toggle. Every chart is a card with title, badge,
  "View as table", an empty state and a loading skeleton, drawn with the
  color-blind safe palette from design.md §4 (axis text 12 px, light gridlines,
  ₦ units).
- **Pure helpers:** `lib/charts/series.ts` (`projectionSeries`,
  `valueByCrop`) with tests; `lib/costs/service.ts` owns the farm-scoped cost
  reads and writes, also with ownership tests.

## Next steps

8. Alerts page · 9. Responsive check at 390 / 768 / 1440 px · 10. Full
click-through, report and demo video.
