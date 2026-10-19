# Rules checklist — 00-global.md §1 (Agriculture: "Agro-Analytics" Farm Dashboard)

Every line from the official rules, proved with where it is in the code and on
the screen. Checked on 2026-10-19 as part of the final pass. Anything the app
cannot honestly prove is marked **MISSING**.

| Rule | Where it is in AgriPrice | Status |
|---|---|---|
| Prices for at least 3 crops from an API or a simulated live feed | 9 crops in the catalog (`lib/market/catalog.ts`); `GET /api/market/prices` and `GET /api/market/history?crop=…&days=…` serve them (`app/api/market/`); behind the `MarketProvider` adapter — `SimulatedProvider` by default, `LiveProvider` when `MARKET_API_URL` is set, with fallback (`lib/market/provider.ts`). Shown on /market, the dashboard, /stock and every crop page. | ✅ |
| Weather forecast for the farm's own coordinates, from a weather API | `GET /api/weather` fetches server-side for the signed-in farm's `lat`/`lon` (`app/api/weather/route.ts` → `lib/weather/provider.ts`); Open-Meteo by default, OpenWeatherMap when `OWM_API_KEY` is set. Coordinates editable on /settings. | ✅ |
| Inventory + "Estimated Market Value" of stock from current prices | /stock: `InventoryItem.qtyKg × latest price` in integer kobo (`lib/stock/value.ts`, unit-tested), total card on top, per-crop rows with source badge. | ✅ |
| At least one external fetch that works, shown on screen | The Open-Meteo forecast is a real external fetch; it appears on the dashboard and /weather with the badge "Live · updated N min ago" (`components/SourceBadge.tsx`, `lib/weather/provider.ts` 30-min cache). | ✅ |
| Line, bar or pie charts for inventory and market trends | Line: /market (7/30/90-day toggle) and /crop/[crop] (30 days + dotted projection). Bar + pie: dashboard "Stock value by crop" and "Share of stock value" with max 5 slices + "Other" (`components/charts/`, `lib/charts/series.ts`, Recharts). Every chart has "View as table". | ✅ |
| Responsive (phone to desktop) | `components/AppShell.tsx`: sidebar ≥ 1024 px, top bar 640–1023 px, bottom nav < 640 px; stock table becomes cards; charts stack. Clicked through at 1440 / 768 / 390 px. | ✅ |
| API keys in environment variables only | `OWM_API_KEY`, `MARKET_API_URL`, `SESSION_SECRET`, `DATABASE_URL` are read from env on the server only; `.env` is git-ignored; `.env.example` commits names, never values. No key exists in client code or the bundle. | ✅ |
| Every data block labeled Live, Saved data or Simulated | `SourceBadge` on: dashboard stat cards, sell-or-hold card, weather card, alerts that come from prices or weather, stock value card, market price cards, every `ChartCard`, the crop decision card, the costs preview. Weather shows "Saved data · N h old" when serving a snapshot after a failed call. | ✅ |
| Disclaimer: "Decision-support tool. You decide." | Footer of the app shell on every signed-in page (`components/AppShell.tsx`); the same line on /login and /signup (`app/(auth)/layout.tsx`). | ✅ |

## Honesty notes (not rule gaps, but said out loud)

- The market feed is **simulated**: every price card, chart and decision that
  comes from prices carries the blue "Simulated" badge, and the footer says
  "Prices are simulated until a reviewed live source is connected". The reason
  is in `docs/real-price-sources.md`.
- Sample numbers (base prices, thresholds, storage/spoilage defaults) are
  placeholders until an expert reviews them; this is stated on /market, /costs
  and in the README, as §2 requires.
