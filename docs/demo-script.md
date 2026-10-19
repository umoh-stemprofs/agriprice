# Demo video script (5–7 minutes)

Agriculture track requirements covered: login, dashboard, the live API call in
the Network tab, stock + Estimated Market Value, charts, the feature (cost
form flip), alerts. Record at 1440 px, browser maximised, no other tabs with
personal data. Total target: 6 minutes.

## 0:00–0:30 — Opening

- Show the login page. Say the one line: "AgriPrice is a farm dashboard that
  answers, per crop: sell now or hold — decision-support tool, you decide."
- Point at the footer line and the note that prices are simulated until a
  reviewed live source is connected.

## 0:30–1:15 — Sign up and login

- Click **Create account**, sign up with a fresh email (show the validation:
  a short password is refused with one sentence).
- Log out, then log back in — wrong password first, so the judge sees the
  single-sentence error: "Email or password is wrong. Check and try again."
- Log in correctly, or use **Try demo account** (visible because
  `DEMO_MODE=true`) to land on the seeded farm.

## 1:15–2:15 — Dashboard first look (00:45)

- Four stat cards, the **alerts banner** ("N alerts today") — click it later.
- The sell-or-hold list: pill + icon + word, the one sentence, the money at
  stake, "Set costs" where costs are missing. Every card shows its
  Live / Saved / Simulated badge.
- Scroll to the bar chart "Stock value by crop" and pie "Share of stock
  value"; click **View as table** on one chart to show the accessible version.

## 2:15–3:15 — Network tab: the live weather call (01:00)

- Open DevTools → **Network**, reload.
- Click the `weather` request: show
  `GET /api/weather` returning `{ok: true, badge: "live"}` — the server
  calling **Open-Meteo for the farm's own coordinates** (4.8156, 7.0498), and
  the Weather card's **"Live · updated …"** badge.
- Then click `prices` (`GET /api/market/prices`): 9 crops, every tick
  `source: "SIMULATED"` — say clearly: prices simulated, weather live; the
  badge on the page matches the payload.

## 3:15–4:15 — Stock and Estimated Market Value (01:00)

- Stock page: total EMV card, table with per-crop value and badge.
- **Add stock** (e.g. Yam 400 kg) — the total updates (qty × latest price).
- **Edit** it to 500 kg, then **Delete** it with the confirm dialog.
- Say the formula out loud: EMV = qtyKg × latest price, integer kobo.

## 4:15–5:15 — The feature: cost form flips Hold → Sell now (01:00)

- Go to the costs form for the crop that currently reads **Hold** (today:
  Catfish — `/costs?crop=CATFISH`).
- Show the preview card: Hold, and "…could earn ₦12,298 more".
- Type a storage cost (e.g. **₦100** per kg per week) and watch the preview
  pill flip to **Sell now** — say: "nothing is saved yet; this is the same
  sellWindow function, same prices, running as I type".
- Press **Save costs**, reopen the dashboard: the crop now reads Sell now
  there too. (Revert the cost afterwards if you want a clean demo farm.)

## 5:15–5:50 — Crop detail and market charts (0:35)

- Open one crop page: big pill, the sentence, the dotted **projection line**
  after the solid 30 days, the three cards (weekly trend, cost of waiting,
  value of stock), Simulated badge.
- Market page: crop chips + **7 / 30 / 90-day** toggle on the line chart.

## 5:50–6:20 — Weather, alerts and the demo switch (0:30)

- Weather page: 5-day forecast, harvest alert banner if rain qualifies.
- Alerts page: today's alerts, each with icon, word, one sentence, one
  button; the empty state reads "No alerts today." when nothing applies.
- With `DEMO_MODE=true`, flip **"Demo: show harvest alert"** — the warning
  appears marked **"Demo preview"**, and say: "no data was changed".

## 6:20–7:00 — Close (0:40)

- Settings (farm coordinates, "Use my location") → log out (back to
  /login).
- Recap in three sentences: simulated price feed with a picked-salt demo that
  always shows one rising and one falling crop; the formula (trend − cost of
  waiting vs minimum gain); weather is the live call. Point at
  `docs/` (task-overview, api.md, schema, rules-checklist) and the repo link.

### Recording checklist

- [ ] Network tab visible for the weather call and the prices call
- [ ] The Hold → Sell now flip happens on camera, before AND after Save
- [ ] At least one chart's "View as table" shown
- [ ] No console errors on screen at any point
- [ ] Footer "Decision-support tool. You decide." visible at the start and end
- [ ] Stop the dev server (`Ctrl+C`) when finished
