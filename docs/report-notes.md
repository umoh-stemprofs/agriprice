# Report notes — bullets for the 4–8 page report

Organised by likely section; every number is from the seeded demo on
2026-10-19 or from the code. Sample thresholds are placeholders until an
expert reviews them (say so in the report, as the rules require).

## Architecture

- Next.js 14 App Router (TypeScript) · Tailwind · Prisma + Postgres (Neon) ·
  Recharts · Zod · iron-session · bcryptjs · date-fns-tz · Vitest; accent
  #1B7F3B.
- **Logic is separate from screens:** `lib/sellWindow.ts` (sell/hold),
  `lib/stock/value.ts` (EMV), `lib/charts/series.ts` (chart series),
  `lib/weather/alerts.ts` (harvest warning), `lib/alerts/today.ts` (today's
  alerts) — all pure functions with unit tests written before the screens
  (00-global §2). 140 tests in 18 files.
- **Adapters for every external service:** `MarketProvider`
  (SimulatedProvider default, LiveProvider behind `MARKET_API_URL` with
  fallback on any failure) and `WeatherProvider` (Open-Meteo default,
  OpenWeatherMap when `OWM_API_KEY` is set; 5 s timeout, one retry,
  30-minute `WeatherSnapshot` cache; failed call → last snapshot with
  "Saved data").
- **Deterministic market feed:** price = round(base × exp(x)) with x a clamped
  random walk seeded per (crop, salt, day), start 2026-01-01 — same day, same
  price, on every machine. `scripts/pick-salts.ts` (runs as predev/prebuild
  and in the test setup) searches salts so today always has one rising and one
  falling crop, so the demo shows both states.
- **Server-first rendering:** pages fetch in parallel with `Promise.all`
  (dashboard starts latest prices, weather and all per-crop histories
  together); charts are client components inside a card with a "View as
  table" fallback.
- **Slow or failing database:** one stalled Postgres connection is retried
  once (`withDbRetry`, `lib/db.ts`, unit-tested) before a page degrades; a
  page that still fails renders the friendly error card inside the app shell
  (`app/(app)/error.tsx`) — verified with a dead database: the dashboard
  keeps working on default weather, and no page ever shows a raw error.

## Security

- Passwords hashed with bcrypt **cost 10**; never stored or logged in plain
  text.
- Session: iron-session cookie `agriprice_session` — httpOnly, sameSite=lax,
  `secure` in production, 7-day age; tampered cookies fail closed.
- **Middleware** redirects signed-out visitors for every page except login and
  signup; **every page and server action re-checks the session** (middleware
  is a fast first gate, never the only one).
- **Ownership scoping:** stock and costs read/write through `farm: { userId }`
  resolved from the session — a pasted id cannot reach another farmer's row
  (ownership tests in `lib/stock/service.test.ts`, `lib/costs/service.test.ts`).
- **Zod on every server input:** quantities 0–1,000,000 kg whole numbers,
  spoilage 0–100, storage ≥ 0, coordinates in range; bad input returns one
  sentence, never a stack trace.
- Secrets only in `.env` (git-ignored); `.env.example` carries names only;
  API keys are read server-side and never reach the client bundle.
- `?next=` redirects accept same-site paths only (no `//` open redirect).

## Responsive design

- Three shells in one component: sidebar 240 px from 1024 px, top bar with
  links 640–1023 px, top bar + 4-item bottom nav below 640 px (Alerts and
  Settings in the phone top bar).
- Stock table becomes cards on phones; charts stack; buttons stay ≥ 48 px;
  bottom nav items ≥ 56 px. Checked by click-through at 1440, 768 and 390 px.
- Accessibility: colour + icon + word on every status, visible focus ring,
  labelled inputs, aria-live notices, "View as table" on every chart,
  prefers-reduced-motion respected. `scroll-padding` keeps focused and
  scrolled-to elements clear of the sticky header and the fixed bottom nav
  (found and fixed in the click-through: a tap could land on a nav link).

## How it helps a farmer earn more (demo numbers, 2026-10-19)

- **Catfish (Hold):** trend +3.50%/week clears the 2% minimum — waiting one
  week on the 120 kg could earn **₦12,298 more**. The app says exactly that.
- **Maize (Sell now):** trend +0.10%/week against ₦8/kg of storage and
  spoilage — waiting one week on 1,200 kg would **lose ₦8,930**. Selling now
  protects the ₦729,144 stock value.
- **Tomato (Sell now):** price falling (−3.61%/week); waiting would cost
  **₦40,522** on 350 kg — the strongest "don't hold" case in the demo.
- The cost form lets the farmer enter *their own* storage and spoilage: change
  a cost and the answer updates live, so the advice reflects the real cost of
  their store, not a guess.
- Total demo stock: **₦1,553,394** Estimated Market Value across 4 crops,
  re-priced every day from the feed.
- Beyond money: the harvest alert (≥ 20 mm rain in 3 days) tells a maize or
  rice farmer to cover or harvest early — avoiding spoilage loss is also profit.

## Limits and what is simulated (honesty section)

- **Prices are simulated.** No free, clearly-licensed, daily Nigerian price
  feed exists yet (`real-price-sources.md` research); every price card is
  badged "Simulated" and the footer says so. Weather is the real external
  fetch.
- The market API is AgriPrice's own deterministic feed; a real feed plugs in
  behind `MARKET_API_URL` without touching the UI, with automatic fallback.
- **Sample numbers:** base prices, 20 mm / 3-day harvest threshold, defaults
  for storage and spoilage — placeholders until an expert reviews them.
- NEED_DATA ("not enough price history") appears in the unit tests; the demo
  cannot show it because the generator always has ≥ 7 days by the time the
  app runs.
- Free-tier Postgres (Neon) and Vercel hosting have cold starts and limits;
  the weather cache (30 min) exists partly for that.
- Single-farm-per-demo scope: no multi-user collaboration, no offline mode,
  no push notifications — alerts are on-page only.
