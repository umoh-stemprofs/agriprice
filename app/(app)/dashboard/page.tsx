import { Prisma } from "@prisma/client";
import Link from "next/link";
import type { ReactNode } from "react";
import { HarvestAlert } from "@/components/HarvestAlert";
import { ChartCard } from "@/components/charts/ChartCard";
import { ValueBarChart } from "@/components/charts/ValueCharts";
import { ValuePieChart } from "@/components/charts/ValueCharts";
import { MoneyLine } from "@/components/MoneyLine";
import { SourceBadge } from "@/components/SourceBadge";
import { StatusPill } from "@/components/StatusPill";
import { WeatherCard } from "@/components/WeatherCard";
import { requireUser } from "@/lib/auth/guard";
import { DEFAULT_FARM, MARKET } from "@/lib/config";
import { db } from "@/lib/db";
import { formatDayLong, todayInTz } from "@/lib/market/dates";
import { catalogFor, type CatalogEntry } from "@/lib/market/catalog";
import type { MarketTick } from "@/lib/market/generator";
import { marketProvider } from "@/lib/market/provider";
import { sellWindow, type SellWindowResult } from "@/lib/sellWindow";
import { harvestAlert } from "@/lib/weather/alerts";
import { valueByCrop } from "@/lib/charts/series";
import { formatKg, formatNaira } from "@/lib/format";
import { getWeather } from "@/lib/weather/provider";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard · AgriPrice" };

type FarmForDashboard = Prisma.FarmGetPayload<{
  include: { inventory: true; costSettings: true };
}>;

/** One crop's answer, with the price it was based on. */
interface Decision {
  id: string;
  qtyKg: number;
  note: string | null;
  entry: CatalogEntry;
  tick: MarketTick | null;
  result: SellWindowResult;
}

function StatCard({
  label,
  value,
  hint,
  badge,
}: {
  label: string;
  value: string;
  hint: string;
  badge?: ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted">{label}</p>
        {badge}
      </div>
      <p className="mt-2 text-4xl font-bold leading-10 tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted">{hint}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const today = todayInTz();

  let farm: FarmForDashboard | null = null;
  let farmUnavailable = false;
  try {
    farm = await db.farm.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      include: {
        inventory: { orderBy: { crop: "asc" } },
        costSettings: true,
      },
    });
  } catch (error) {
    // A slow database loses the stock section, never the weather (step 4A).
    farmUnavailable = true;
    console.warn("Could not load farm:", error instanceof Error ? error.message : error);
  }

  const provider = marketProvider();
  const [market, weather] = await Promise.all([
    provider.latestPrices(today).catch(() => null),
    getWeather(farm?.lat ?? DEFAULT_FARM.lat, farm?.lon ?? DEFAULT_FARM.lon, {
      farmId: farm?.id ?? null,
    }),
  ]);

  const priceByCrop = new Map<MarketTick["crop"], MarketTick>(
    (market?.ticks ?? []).map((tick) => [tick.crop, tick]),
  );
  const costByCrop = new Map(
    (farm?.costSettings ?? []).map((cost) => [cost.crop, cost] as const),
  );

  const decisions: Decision[] = await Promise.all(
    (farm?.inventory ?? []).map(async (item) => {
      const history = await provider
        .history(item.crop, today, MARKET.trendDays)
        .catch(() => null);
      const prices = history?.ticks.map((tick) => tick.priceKobo) ?? [];

      return {
        id: item.id,
        qtyKg: item.qtyKg,
        note: item.note,
        entry: catalogFor(item.crop),
        tick: priceByCrop.get(item.crop) ?? null,
        result: sellWindow(prices, item.qtyKg, costByCrop.get(item.crop) ?? null),
      };
    }),
  );

  const totalStockValue = decisions.reduce((sum, d) => sum + d.result.stockValueNowKobo, 0);
  const sellNowCount = decisions.filter((d) => d.result.status === "SELL_NOW").length;
  const holdCount = decisions.filter((d) => d.result.status === "HOLD").length;
  const needsDataCount = decisions.filter((d) => d.result.status === "NEED_DATA").length;

  const alert = weather.ok
    ? harvestAlert(
        weather.data.daily,
        (farm?.inventory ?? []).map((item) => item.crop),
      )
    : null;

  const weatherBadge = weather.ok ? weather.badge : null;

  // Value by crop for the bar chart and the pie (max 5 slices, rest = Other).
  const valueSlices = valueByCrop(
    decisions.map((decision) => ({
      label: decision.entry.label,
      valueKobo: decision.result.stockValueNowKobo,
    })),
  );
  const valueTable = {
    headers: ["Crop", "Value"],
    rows: valueSlices.map((slice) => [slice.label, formatNaira(slice.valueKobo)]),
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted">
            {formatDayLong(today)} · {farm?.name ?? "Your farm"}
          </p>
        </div>
        <Link href="/stock" className="btn-primary">
          Add stock
        </Link>
      </header>

      {alert && weather.ok && <HarvestAlert alert={alert} badge={weather.badge} />}

      <section aria-label="Today at a glance" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total stock value"
          value={formatNaira(totalStockValue)}
          hint={market ? "As of today" : "Prices unavailable"}
          badge={<SourceBadge kind="simulated" />}
        />
        <StatCard
          label="Crops to sell now"
          value={String(sellNowCount)}
          hint={
            decisions.length === 0
              ? "No stock yet"
              : `Of ${decisions.length} crop${decisions.length === 1 ? "" : "s"} in stock`
          }
          badge={<SourceBadge kind="simulated" />}
        />
        <StatCard
          label="Crops to hold"
          value={String(holdCount)}
          hint={needsDataCount > 0 ? `${needsDataCount} still need price history` : "Waiting looks better"}
          badge={<SourceBadge kind="simulated" />}
        />
        <StatCard
          label="Weather now"
          value={weather.ok ? `${Math.round(weather.data.current.tempC)}°C` : "—"}
          hint={weather.ok ? weather.data.current.text : weather.error}
          badge={weatherBadge ? <SourceBadge kind={weatherBadge} /> : undefined}
        />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <section aria-labelledby="sell-hold-title" className="card xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="sell-hold-title" className="text-xl font-semibold">
                Sell or hold
              </h2>
              <p className="text-muted">What the next week looks like for each crop you hold.</p>
            </div>
            <SourceBadge kind="simulated" />
          </div>

          {farmUnavailable && (
            <p className="mt-4 rounded-input border border-warning bg-warning-bg px-3 py-2 text-warning">
              We could not load your stock just now. The weather still works; try again in a moment.
            </p>
          )}

          {decisions.length === 0 ? (
            <div className="mt-6 rounded-card border border-border p-6 text-center">
              <p className="font-medium">No stock yet.</p>
              <p className="mt-1 text-muted">Add what you are holding and the app will tell you when to sell.</p>
              <Link href="/stock" className="btn-primary mt-4">
                Add stock
              </Link>
            </div>
          ) : (
            <ul className="mt-2">
              {decisions.map((decision) => (
                <li key={decision.id} className="border-t border-border py-4 first:border-t-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        <Link
                          href={`/crop/${decision.entry.crop}`}
                          className="hover:text-accent hover:underline"
                        >
                          {decision.entry.label}
                        </Link>
                      </p>
                      <p className="text-sm text-muted">
                        {formatKg(decision.qtyKg)} in stock ·{" "}
                        {decision.tick
                          ? `${formatNaira(decision.tick.priceKobo)} / ${decision.entry.unitLabel} today`
                          : "price unavailable"}
                      </p>
                    </div>
                    <StatusPill status={decision.result.status} />
                  </div>

                  <p className="mt-2">{decision.result.message}</p>
                  <MoneyLine
                    status={decision.result.status}
                    changeIfWaitKobo={decision.result.changeIfWaitKobo}
                  />

                  <p className="mt-1 text-sm text-muted">
                    Stock value now: {formatNaira(decision.result.stockValueNowKobo)}
                  </p>

                  {decision.result.costsNotSet && (
                    <p className="mt-1 text-sm">
                      <Link
                        href={`/costs?crop=${decision.entry.crop}`}
                        className="font-medium text-accent underline"
                      >
                        Set costs
                      </Link>{" "}
                      <span className="text-muted">so holding costs are counted.</span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <WeatherCard weather={weather} variant="narrow" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Stock value by crop"
          subtitle={`As of ${formatDayLong(today)}`}
          table={valueTable}
          emptyMessage="Add stock and its value shows up here."
        >
          <ValueBarChart slices={valueSlices} />
        </ChartCard>
        <ChartCard
          title="Share of stock value"
          subtitle="Up to five slices, the rest grouped as Other"
          table={valueTable}
          emptyMessage="Add stock and its share shows up here."
        >
          <ValuePieChart slices={valueSlices} />
        </ChartCard>
      </div>
    </div>
  );
}
