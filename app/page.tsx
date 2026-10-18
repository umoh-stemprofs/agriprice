import { Crop } from "@prisma/client";
import { db } from "@/lib/db";
import { SourceBadge } from "@/components/SourceBadge";
import { MARKET } from "@/lib/config";
import { catalogFor, cropLabel } from "@/lib/market/catalog";
import { ageLabel, todayInTz } from "@/lib/market/dates";
import { historyPrices } from "@/lib/market/generator";
import { marketProvider } from "@/lib/market/provider";
import { directionOf, weeklyTrendPct } from "@/lib/market/trend";
import { harvestAlert } from "@/lib/weather/alerts";
import { farmLocation, getWeather } from "@/lib/weather/provider";
import type { WeatherResult } from "@/lib/weather/types";

export const dynamic = "force-dynamic";

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString("en-NG")}`;

const TREND_TEXT = {
  rising: { word: "rising", arrow: "↑", className: "text-success" },
  falling: { word: "falling", arrow: "↓", className: "text-danger" },
  flat: { word: "steady", arrow: "→", className: "text-muted" },
} as const;

type FarmSummary = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  currency: string;
  user: { name: string };
  inventory: { id: string; crop: Crop; qtyKg: number }[];
} | null;

async function loadFarm(): Promise<FarmSummary> {
  try {
    return (await db.farm.findFirst({
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { name: true } },
        inventory: { orderBy: { crop: "asc" }, select: { id: true, crop: true, qtyKg: true } },
      },
    })) as FarmSummary;
  } catch {
    return null;
  }
}

function WeatherCard({ weather }: { weather: WeatherResult }) {
  if (!weather.ok) {
    return (
      <section aria-labelledby="weather-title" className="rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <h2 id="weather-title" className="text-xl font-semibold">Weather</h2>
        </div>
        <div className="mt-4 rounded-card border border-danger bg-danger-bg p-4">
          <p className="font-medium text-danger">Weather unavailable</p>
          <p className="mt-1 text-muted">{weather.error}</p>
          <a
            href="/"
            className="mt-3 inline-flex min-h-[48px] items-center rounded-lg bg-accent px-4 py-2 font-medium text-white"
          >
            Retry
          </a>
        </div>
      </section>
    );
  }

  const { data, badge } = weather;
  return (
    <section aria-labelledby="weather-title" className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="weather-title" className="text-xl font-semibold">Weather</h2>
          <p className="text-muted">Farm coordinates · 5-day forecast</p>
        </div>
        <SourceBadge kind={badge} age={ageLabel(new Date(data.fetchedAt))} />
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        <p className="text-4xl font-bold tabular-nums">{Math.round(data.current.tempC)}°C</p>
        <p className="text-muted">
          {data.current.text} · humidity {data.current.humidity}% · wind {data.current.windKmh} km/h
        </p>
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {data.daily.map((day) => (
          <li key={day.date} className="rounded-card border border-border p-3 text-center">
            <p className="text-sm font-medium text-muted">{day.date.slice(5)}</p>
            <p className="mt-1 font-semibold tabular-nums">
              {Math.round(day.maxC)}° / {Math.round(day.minC)}°
            </p>
            <p className="text-sm text-muted tabular-nums">{day.rainMm} mm</p>
            <p className="text-sm text-muted tabular-nums">{day.rainChancePct}% rain</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function HomePage() {
  const today = todayInTz();

  const [location, farm, market] = await Promise.all([
    farmLocation(),
    loadFarm(),
    marketProvider()
      .latestPrices(today)
      .catch(() => null),
  ]);
  const weather = await getWeather(location.lat, location.lon);

  const inventoryCrops = (farm?.inventory ?? []).map((item) => item.crop);
  const alert = weather.ok ? harvestAlert(weather.data.daily, inventoryCrops) : null;

  const priceCards =
    market?.ticks.map((tick) => {
      const prices = historyPrices(tick.crop, today, MARKET.trendDays);
      const trend = weeklyTrendPct(prices);
      const direction = directionOf(prices);
      const style = TREND_TEXT[direction];
      const entry = catalogFor(tick.crop);
      return { tick, trend, direction, style, entry };
    }) ?? [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-6">
        <p className="text-sm font-medium text-accent">Agro-analytics dashboard</p>
        <h1 className="text-3xl font-bold">AgriPrice</h1>
        <p className="mt-1 text-muted">Sell now or hold, with today&apos;s prices and forecast.</p>
      </header>

      {alert && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-card border border-warning bg-warning-bg p-4"
        >
          <span aria-hidden="true">⚠</span>
          <div>
            <p className="font-medium text-warning">{alert.message}</p>
            <p className="text-muted">
              {alert.rainMm} mm rain expected in the next {alert.days} days for{" "}
              {alert.crops.map(cropLabel).join(" and ")}.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <WeatherCard weather={weather} />

        <section aria-labelledby="prices-title" className="rounded-card border border-border bg-surface p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="prices-title" className="text-xl font-semibold">Today&apos;s prices</h2>
              <p className="text-muted">{today} · simulated live feed</p>
            </div>
            <SourceBadge kind="simulated" />
          </div>

          {priceCards.length === 0 ? (
            <p className="mt-4 text-muted">Prices are unavailable right now. Try again later.</p>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {priceCards.map(({ tick, trend, style, entry }) => (
                <li key={tick.crop} className="rounded-card border border-border p-3">
                  <p className="text-sm font-medium text-muted">{entry.label}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {naira(tick.priceKobo)}
                    <span className="text-sm font-normal text-muted"> / {entry.unitLabel}</span>
                  </p>
                  <p className={`mt-1 text-sm font-medium ${style.className}`}>
                    {style.arrow} {Math.abs(trend).toFixed(1)}% {style.word} a week
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="stock-title" className="mt-6 rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 id="stock-title" className="text-xl font-semibold">
          {farm ? farm.name : "Stock"}
        </h2>
        {farm ? (
          <>
            <p className="text-muted">
              {farm.user.name} · {farm.lat}, {farm.lon} · {farm.currency}
            </p>
            <ul className="mt-4 divide-y divide-border">
              {farm.inventory.map((item) => (
                <li key={item.id} className="flex items-center justify-between py-3">
                  <span>{cropLabel(item.crop)}</span>
                  <span className="tabular-nums text-muted">
                    {item.qtyKg.toLocaleString("en-NG")} kg
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted">
              {farm.inventory.length} crops in stock ·{" "}
              {farm.inventory.reduce((sum, i) => sum + i.qtyKg, 0).toLocaleString("en-NG")} kg total.
            </p>
          </>
        ) : (
          <p className="mt-2 text-muted">
            Database is reachable but empty. Run <code>npm run db:seed</code>.
          </p>
        )}
      </section>

      <footer className="mt-8 text-sm text-muted">
        Decision-support tool. You decide. · Prices are simulated until a reviewed live source is
        connected.
      </footer>
    </main>
  );
}
