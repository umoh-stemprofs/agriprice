import { Prisma } from "@prisma/client";
import Link from "next/link";
import { HarvestAlert } from "@/components/HarvestAlert";
import { ChartCard } from "@/components/charts/ChartCard";
import { ValueBarChart } from "@/components/charts/ValueCharts";
import { ValuePieChart } from "@/components/charts/ValueCharts";
import { MoneyLine } from "@/components/MoneyLine";
import { SourceBadge } from "@/components/SourceBadge";
import { StatusPill } from "@/components/StatusPill";
import { Icon } from "@/components/ui/icons";
import { StatCard, Tile } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth/guard";
import { DEFAULT_FARM, MARKET } from "@/lib/config";
import { db, withDbRetry } from "@/lib/db";
import { formatDayLong, todayInTz } from "@/lib/market/dates";
import { catalogFor, type CatalogEntry } from "@/lib/market/catalog";
import type { MarketTick } from "@/lib/market/generator";
import { marketProvider } from "@/lib/market/provider";
import { sellWindow, type SellWindowResult } from "@/lib/sellWindow";
import { harvestAlert } from "@/lib/weather/alerts";
import { buildTodayAlerts } from "@/lib/alerts/today";
import { valueByCrop } from "@/lib/charts/series";
import { cropIdentity, tileClasses } from "@/lib/crop-identity";
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

export default async function DashboardPage() {
  const user = await requireUser();
  const today = todayInTz();

  let farm: FarmForDashboard | null = null;
  let farmUnavailable = false;
  try {
    // withDbRetry: a transient pool timeout is retried once before the page
    // falls back to the "stock unavailable" notice (lib/db.ts).
    farm = await withDbRetry(() =>
      db.farm.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
        include: {
          inventory: { orderBy: { crop: "asc" } },
          costSettings: true,
        },
      }),
    );
  } catch (error) {
    // A slow database loses the stock section, never the weather (step 4A).
    farmUnavailable = true;
    console.warn("Could not load farm:", error instanceof Error ? error.message : error);
  }

  const provider = marketProvider();
  const inventory = farm?.inventory ?? [];
  // Everything that does not depend on the others starts at the same time:
  // latest prices, the weather, and one history per crop in stock.
  const [market, weather, histories] = await Promise.all([
    provider.latestPrices(today).catch(() => null),
    getWeather(farm?.lat ?? DEFAULT_FARM.lat, farm?.lon ?? DEFAULT_FARM.lon, {
      farmId: farm?.id ?? null,
    }),
    Promise.all(
      inventory.map((item) =>
        provider.history(item.crop, today, MARKET.trendDays).catch(() => null),
      ),
    ),
  ]);

  const priceByCrop = new Map<MarketTick["crop"], MarketTick>(
    (market?.ticks ?? []).map((tick) => [tick.crop, tick]),
  );
  const costByCrop = new Map(
    (farm?.costSettings ?? []).map((cost) => [cost.crop, cost] as const),
  );

  const decisions: Decision[] = inventory.map((item, index) => {
    const prices = histories[index]?.ticks.map((tick) => tick.priceKobo) ?? [];

    return {
      id: item.id,
      qtyKg: item.qtyKg,
      note: item.note,
      entry: catalogFor(item.crop),
      tick: priceByCrop.get(item.crop) ?? null,
      result: sellWindow(prices, item.qtyKg, costByCrop.get(item.crop) ?? null),
    };
  });

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

  const alertsToday = buildTodayAlerts({
    crops: decisions.map((decision) => ({
      crop: decision.entry.crop,
      status: decision.result.status,
      message: decision.result.message,
      costsNotSet: decision.result.costsNotSet,
    })),
    harvest: alert,
    weatherError: weather.ok ? null : weather.error,
  });

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

  // The overview screen's status banner: one sentence about the whole farm.
  const allGood = decisions.every((d) => d.result.status !== "SELL_NOW") ? false : true;
  const statusTitle =
    decisions.length === 0
      ? "Farm status: add your stock to start"
      : sellNowCount > 0
        ? `Farm status: ${sellNowCount} crop${sellNowCount === 1 ? "" : "s"} ready to sell`
        : "Farm status: everything is running good";
  const statusLine =
    decisions.length === 0
      ? "Weather is checked and the market feed is running. Add what you are holding to get a sell-or-hold answer."
      : weather.ok
        ? `Prices, costs and the weather are checked for ${farm?.name ?? "your farm"} today.`
        : "Prices and stock are checked; the weather could not be fetched just now.";

  const tempNow = weather.ok ? `${Math.round(weather.data.current.tempC)}°C` : "—";

  return (
    <div className="space-y-8">
      {/* ---------------------------------------------- 1. status banner */}
      <section className="panel-lg flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <Tile tint="brand" size="lg">
            <Icon name="checkCircle" className="h-10 w-10" />
          </Tile>
          <div>
            <h1 className="display text-display-md text-ink">{statusTitle}</h1>
            <p className="mt-1 text-[15px] font-medium text-ink-muted">{statusLine}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <span className="chip border-leaf-300 bg-leaf-100 px-4 py-2.5 text-[15px] font-extrabold uppercase tracking-wide text-brand">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-optimal opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-optimal" />
            </span>
            {allGood ? "Prices checked" : "Markets running"}
          </span>
        </div>
      </section>

      {alertsToday.length > 0 && (
        <Link
          href="/alerts"
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-info-line bg-info-bg px-4 py-3"
        >
          <span className="flex items-center gap-2 font-medium text-info-text">
            <Icon name="alerts" className="h-5 w-5" />
            {alertsToday.length} alert{alertsToday.length === 1 ? "" : "s"} today
          </span>
          <span className="flex items-center gap-1 font-medium text-info-text">
            Open alerts
            <Icon name="chevronRight" className="h-4 w-4" />
          </span>
        </Link>
      )}

      {alert && weather.ok && <HarvestAlert alert={alert} />}

      {/* ------------------------------------------ 2. glanceable cards */}
      <section aria-label="Today at a glance" className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total stock value"
          value={formatNaira(totalStockValue)}
          hint={market ? `As of ${formatDayLong(today)}` : "Prices unavailable"}
          tile={
            <span className="flex h-12 w-12 items-center justify-center rounded-tile bg-leaf-100 text-brand">
              <Icon name="coins" className="h-6 w-6" />
            </span>
          }
        />
        <StatCard
          label="Crops to sell now"
          value={String(sellNowCount)}
          unit="crops"
          accent
          hint={
            decisions.length === 0
              ? "No stock yet"
              : `Of ${decisions.length} crop${decisions.length === 1 ? "" : "s"} in stock`
          }
          tile={
            <span className="flex h-12 w-12 items-center justify-center rounded-tile bg-leaf-100 text-brand">
              <Icon name="trendUp" className="h-6 w-6" />
            </span>
          }
          footer={
            <span className="inline-flex items-center gap-1.5 rounded-chip bg-leaf-100 px-3 py-1.5 text-[13px] font-bold text-brand">
              <Icon name="check" className="h-4 w-4" />
              {sellNowCount > 0 ? "Action needed today" : "Nothing to rush"}
            </span>
          }
        />
        <StatCard
          label="Crops to hold"
          value={String(holdCount)}
          unit="crops"
          hint={needsDataCount > 0 ? `${needsDataCount} still need price history` : "Waiting looks better"}
          tile={
            <span className="flex h-12 w-12 items-center justify-center rounded-tile bg-warn-bg text-warn-text">
              <Icon name="stock" className="h-6 w-6" />
            </span>
          }
        />
        <StatCard
          label="Weather now"
          value={tempNow}
          hint={weather.ok ? weather.data.current.text : weather.error}
          tile={
            <span className="flex h-12 w-12 items-center justify-center rounded-tile bg-sky-100 text-sky-deep">
              <Icon name={weather.ok ? "sun" : "cloud"} className="h-6 w-6" />
            </span>
          }
        />
      </section>

      {/* ------------------------------------- 3. decisions + weather */}
      <div className="grid items-start gap-6 xl:grid-cols-3">
        <section aria-labelledby="sell-hold-title" className="panel xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="sell-hold-title" className="text-headline-lg">
                Sell or hold
              </h2>
              <p className="mt-1 text-[14px] text-ink-muted">
                What the next week looks like for each crop you hold.
              </p>
            </div>
            <SourceBadge kind="simulated" />
          </div>

          {farmUnavailable && (
            <p className="mt-4 rounded-input border border-warn-line bg-warn-bg px-3 py-2 text-warn-text">
              We could not load your stock just now. The weather still works; try again in a moment.
            </p>
          )}

          {decisions.length === 0 ? (
            <div className="mt-6 rounded-panel border border-line p-8 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-tile bg-leaf-100 text-brand">
                <Icon name="sprout" className="h-7 w-7" />
              </span>
              <p className="mt-4 font-semibold">No stock yet.</p>
              <p className="mt-1 text-ink-muted">
                Add what you are holding and the app will tell you when to sell.
              </p>
              <Link href="/stock" className="btn-primary mt-4">
                <Icon name="add" className="h-4 w-4" />
                Add stock
              </Link>
            </div>
          ) : (
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {decisions.map((decision) => {
                const identity = cropIdentity(decision.entry.crop);
                return (
                  <li
                    key={decision.id}
                    className="flex flex-col justify-between gap-4 rounded-panel border border-line p-4 transition-colors hover:border-line-strong"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-tile text-2xl ${tileClasses(
                              identity.tone,
                            )}`}
                            aria-hidden="true"
                          >
                            {identity.emoji}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              <Link
                                href={`/crop/${decision.entry.crop}`}
                                className="hover:text-brand hover:underline"
                              >
                                {decision.entry.label}
                              </Link>
                            </p>
                            <p className="truncate text-[13px] text-ink-muted">
                              {formatKg(decision.qtyKg)} in stock ·{" "}
                              {decision.tick
                                ? `${formatNaira(decision.tick.priceKobo)} / ${decision.entry.unitLabel}`
                                : "price unavailable"}
                            </p>
                          </div>
                        </div>
                        <StatusPill status={decision.result.status} />
                      </div>

                      <p className="mt-3 text-[14px]">{decision.result.message}</p>
                      <MoneyLine
                        status={decision.result.status}
                        changeIfWaitKobo={decision.result.changeIfWaitKobo}
                      />

                      <p className="mt-1 text-[13px] text-ink-muted tabular">
                        Stock value now: {formatNaira(decision.result.stockValueNowKobo)}
                      </p>

                      {decision.result.costsNotSet && (
                        <p className="mt-1 text-[13px]">
                          <Link
                            href={`/costs?crop=${decision.entry.crop}`}
                            className="font-medium text-brand underline"
                          >
                            Set costs
                          </Link>{" "}
                          <span className="text-ink-muted">so holding costs are counted.</span>
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Weather column, same geometry as the design's right-hand panel */}
        <section aria-labelledby="weather-title" className="panel">            <h2 id="weather-title" className="text-headline-lg">
              Weather today
            </h2>

          {!weather.ok ? (
            <div className="mt-4 rounded-panel border border-loss-line bg-loss-bg p-4">
              <p className="font-medium text-loss-text">Weather is unavailable</p>
              <p className="mt-1 text-[13px] text-ink-muted">{weather.error}</p>
              <Link href="/weather" className="btn-secondary mt-3">
                Retry
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-4 flex items-center gap-4">
                <Tile tint="warn" size="lg">
                  <Icon name="sun" className="h-10 w-10" />
                </Tile>
                <div>
                  <p className="display text-readout-sm tabular text-ink">
                    {Math.round(weather.data.current.tempC)}°C
                  </p>
                  <p className="text-[14px] font-medium text-ink-muted">
                    {weather.data.current.text}
                  </p>
                </div>
              </div>

              <dl className="mt-4 space-y-2 text-[13px]">
                <div className="flex items-center justify-between gap-3 rounded-input bg-surface-lower px-3 py-2">
                  <dt className="flex items-center gap-2 text-ink-muted">
                    <Icon name="water" className="h-4 w-4 text-sky" />
                    Humidity
                  </dt>
                  <dd className="font-semibold tabular">{weather.data.current.humidity}%</dd>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-input bg-surface-lower px-3 py-2">
                  <dt className="flex items-center gap-2 text-ink-muted">
                    <Icon name="wind" className="h-4 w-4" />
                    Wind
                  </dt>
                  <dd className="font-semibold tabular">
                    {Math.round(weather.data.current.windKmh)} km/h
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-input bg-surface-lower px-3 py-2">
                  <dt className="flex items-center gap-2 text-ink-muted">
                    <Icon name="rain" className="h-4 w-4 text-sky" />
                    Rain tomorrow
                  </dt>
                  <dd className="font-semibold tabular">
                    {weather.data.daily[1]
                      ? `${Math.round(weather.data.daily[1].rainMm)} mm`
                      : "—"}
                  </dd>
                </div>
              </dl>

              <Link href="/weather" className="btn-secondary mt-4 w-full">
                Open full forecast
              </Link>
            </>
          )}
        </section>
      </div>

      {/* -------------------------------------------- 4. value charts */}
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
