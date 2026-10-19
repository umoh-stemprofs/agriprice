# Task overview — AgriPrice (Agro-Analytics Farm Dashboard)

One page: what the app does, which APIs it uses, what is Live and what is
Simulated, and how the two formulas work — with a worked example computed from
the seeded demo farm on 2026-10-19.

## What it does

AgriPrice answers one question per crop: **sell now or hold?** It takes the
last 14 daily prices from the market feed, estimates the move over the next
week, subtracts what waiting costs (storage + spoilage), and — when waiting
wins — shows the naira amount at stake on the stock the farm actually holds.
It also forecasts the farm's own weather, warns about heavy rain before
harvest, and keeps an inventory with an Estimated Market Value.

## APIs used

| API | Purpose | Live or Simulated |
|---|---|---|
| Open-Meteo `api.open-meteo.com/v1/forecast` (default, no key) | 5-day forecast for the farm's own lat/lon | **Live** — real external fetch, badge "Live · updated N min ago" |
| OpenWeatherMap `api.openweathermap.org/data/2.5/forecast` (when `OWM_API_KEY` is set) | same, alternative provider | **Live** |
| AgriPrice's own `GET /api/market/prices` and `/api/market/history` | daily prices for 9 crops | **Simulated** — deterministic generator (badged "Simulated"); the stored weather snapshot after a failed call is badged "Saved data" |
| Optional `MARKET_API_URL` feed | would replace the market API | **Live when wired** — `LiveProvider` falls back to Simulated on any failure and the badge flips with it |

Nothing is called from the browser: weather and market calls run on the
server only. Keys live in environment variables.

## Formula 1 — sell now or hold (`lib/sellWindow.ts`, pure + tested)

Inputs: last 14 daily prices (kobo), quantity in stock (kg), the crop's
`CostSetting` (or none).

1. Fewer than 7 prices → **NEED_DATA**: "Not enough price history yet."
2. `slope` = least-squares slope of price against day number (kobo/day);
   `mean` = average price.
3. `weeklyTrendPct = clamp(slope × 7 / mean × 100, −20, +20)` — one week's
   expected move, clamped so one wild week cannot decide alone.
4. `projected = latest × (1 + weeklyTrendPct / 100)`.
5. `holdCostPerKg = storageKoboPerKgPerWeek + latest × spoilagePctPerWeek / 100`
   (costs not set → 0, with a "Set costs" link).
6. `netGainPerKg = projected − latest − holdCostPerKg`.
7. If `netGainPerKg ≥ latest × minGainPct / 100` → **HOLD** (waiting clears
   the minimum gain). Otherwise → **SELL_NOW**.

The separate harvest alert (≥ 20 mm rain in 3 days for maize or rice paddy in
stock) never changes the badge — it is a harvest warning, not a price signal.

## Formula 2 — Estimated Market Value (`lib/stock/value.ts`)

`EMV(item) = qtyKg × latestPriceKobo`, summed per crop and in total, kept as
integer kobo and formatted as naira at the edge, with "as of {price date}"
and the Simulated badge.

## Worked example — the seeded demo farm (2026-10-19)

Stock: Maize 1,200 kg · Cassava 600 kg · Tomato 350 kg · Catfish 120 kg.
Costs: maize ₦2/kg/wk storage + 1% spoilage (min gain 2%); cassava ₦1 + 4%
(min 2%); tomato ₦3 + 12% (min 3%); catfish not set.

**Maize → Sell now.** Latest ₦608/kg. Trend +0.10%/week, so `projected` adds
only ~₦0.61/kg. Waiting costs `₦2 storage + ₦6 spoilage = ₦8/kg`, so
`netGainPerKg = 0.61 − 8 ≈ −₦7` — below the 2% minimum (and below zero).
Waiting one week on the 1,200 kg would **lose ₦8,930**.
Message: "Waiting costs more than you would gain."
Stock value now: 1,200 × ₦608 = **₦729,144**.

**Catfish → Hold.** Latest ₦2,926/kg. Trend +3.50%/week → `projected`
+₦102/kg. Costs not set, so the hold cost counts as 0 and the page offers
"Set costs". `netGainPerKg = ₦102 ≥ 2% of ₦2,926 (₦58)` → HOLD.
Waiting one week on the 120 kg could earn **₦12,298** more.
Message: "Price is rising about 3.5% a week. Waiting 1 week could earn
₦12,298 more on your stock."
Stock value now: 120 × ₦2,926 = **₦351,149**.

(Today's other two: cassava Sell now — 1.94%/week but ₦16/kg of holding cost;
tomato Sell now — price not going up, −3.61%/week. Total Estimated Market
Value of the demo stock: **₦1,553,394**.)

Which crop is Hold and which is Sell now is decided by the picked salts for
the day (`scripts/pick-salts.ts` guarantees one rising and one falling crop),
so the demo always shows both states — the numbers above are today's actual
output of the same functions the pages run.

## Where the judge clicks

Login → dashboard (stat cards, sell-or-hold list, alerts banner, charts) →
market (7/30/90 line) → crop detail (dotted projection) → costs (live preview
flips Hold → Sell now before saving) → stock (EMV) → weather (live call) →
alerts (harvest warning) → settings.
