import type { Crop } from "@prisma/client";
import Link from "next/link";
import { ChartCard } from "@/components/charts/ChartCard";
import { PriceLineChart } from "@/components/charts/PriceLineChart";
import { SourceBadge } from "@/components/SourceBadge";
import { requireUser } from "@/lib/auth/guard";
import { cropField } from "@/lib/auth/validation";
import { MARKET } from "@/lib/config";
import type { PricePoint } from "@/lib/charts/series";
import { catalogFor, CATALOG } from "@/lib/market/catalog";
import { formatDayLong, formatDayShort, todayInTz } from "@/lib/market/dates";
import { marketProvider } from "@/lib/market/provider";
import { formatNaira, formatSignedPercent } from "@/lib/format";

const DAY_CHOICES = [7, 30, 90] as const;

export const dynamic = "force-dynamic";
export const metadata = { title: "Market · AgriPrice" };

/**
 * Market (docs/01-agriprice.md page 6): a price card per crop with the change
 * since yesterday, then one line chart per crop with a 7 / 30 / 90-day toggle.
 * The range and the crop are links, so the chart is server-rendered and the
 * browser never talks to a feed itself.
 */
export default async function MarketPage({
  searchParams,
}: {
  searchParams: { crop?: string; days?: string };
}) {
  await requireUser();
  const today = todayInTz();
  const provider = marketProvider();

  let selected: Crop | null = null;
  if (typeof searchParams.crop === "string") {
    const parsed = cropField.safeParse(searchParams.crop);
    if (parsed.success) selected = parsed.data;
  }
  if (!selected) selected = CATALOG[0].crop;

  const requestedDays = Number(searchParams.days);
  const days = (DAY_CHOICES as readonly number[]).includes(requestedDays)
    ? requestedDays
    : MARKET.defaultHistoryDays;

  const [latest, changes, history] = await Promise.all([
    provider.latestPrices(today).catch(() => null),
    Promise.all(
      CATALOG.map(async (entry) => {
        const cropHistory = await provider.history(entry.crop, today, 2).catch(() => null);
        const prices = cropHistory?.ticks.map((tick) => tick.priceKobo) ?? [];
        const yesterday = prices.length === 2 ? prices[0] : null;
        const current = prices.length > 0 ? prices[prices.length - 1] : null;
        if (!yesterday || !current || yesterday === 0) return [entry.crop, null] as const;
        return [entry.crop, ((current - yesterday) / yesterday) * 100] as const;
      }),
    ),
    provider.history(selected, today, days).catch(() => null),
  ]);

  const changeByCrop = new Map(changes);
  const tickByCrop = new Map((latest?.ticks ?? []).map((tick) => [tick.crop, tick] as const));

  const entry = catalogFor(selected);
  const points: PricePoint[] = (history?.ticks ?? []).map((tick) => ({
    date: tick.date,
    priceKobo: tick.priceKobo,
  }));
  const chartTable = {
    headers: ["Date", "Price"],
    rows: points.map((point) => [formatDayShort(point.date), formatNaira(point.priceKobo)]),
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Market</h1>
        <p className="text-muted">
          {formatDayLong(today)} · prices for the last {MARKET.trendDays} days feed the sell-or-hold
          answer.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <SourceBadge kind="simulated" />
        <p className="text-sm text-muted">
          The simulated feed is deterministic, so the same day always shows the same price.
        </p>
      </div>

      {!latest ? (
        <div className="card">
          <p className="font-medium">Prices are unavailable right now.</p>
          <p className="mt-1 text-muted">Try again in a moment. The rest of the app still works.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {CATALOG.map((item) => {
            const tick = tickByCrop.get(item.crop) ?? null;
            const change = changeByCrop.get(item.crop) ?? null;
            const rising = change !== null && change > 0;
            const falling = change !== null && change < 0;

            return (
              <li key={item.crop} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      <Link
                        href={`/crop/${item.crop}`}
                        className="hover:text-accent hover:underline"
                      >
                        {item.label}
                      </Link>
                    </p>
                    <p className="text-sm text-muted">per {item.unitLabel}</p>
                  </div>
                  <SourceBadge kind="simulated" />
                </div>

                <p className="mt-3 text-3xl font-bold tabular-nums">
                  {tick ? formatNaira(tick.priceKobo) : "—"}
                </p>

                <p
                  className={`mt-1 text-sm font-medium ${
                    rising ? "text-success" : falling ? "text-danger" : "text-muted"
                  }`}
                >
                  {change === null
                    ? "No change data"
                    : `${rising ? "↑" : falling ? "↓" : "→"} ${formatSignedPercent(change)} since yesterday`}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <section aria-label="Price history" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Choose a crop" className="flex flex-wrap gap-2">
            {CATALOG.map((item) => {
              const current = item.crop === selected;
              return (
                <Link
                  key={item.crop}
                  href={`/market?crop=${item.crop}&days=${days}`}
                  aria-current={current ? "page" : undefined}
                  className={`inline-flex min-h-[40px] items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    current
                      ? "border-accent/40 bg-success-bg text-accent"
                      : "border-border bg-surface text-muted hover:bg-bg hover:text-text"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <nav aria-label="Chart range" className="flex gap-1 rounded-full border border-border bg-surface p-1">
            {DAY_CHOICES.map((choice) => {
              const current = choice === days;
              return (
                <Link
                  key={choice}
                  href={`/market?crop=${selected}&days=${choice}`}
                  aria-current={current ? "page" : undefined}
                  className={`inline-flex min-h-[40px] items-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    current ? "bg-accent text-white" : "text-muted hover:bg-bg hover:text-text"
                  }`}
                >
                  {choice} days
                </Link>
              );
            })}
          </nav>
        </div>

        <ChartCard
          title="Price history"
          subtitle={`${entry.label} · last ${days} days`}
          table={chartTable}
          emptyMessage="No prices in this range yet."
        >
          <PriceLineChart actual={points} />
        </ChartCard>
      </section>

      <p className="text-sm text-muted">
        Base prices are sample numbers in{" "}
        <code className="rounded bg-surface px-1 py-0.5">lib/market/catalog.ts</code>. An expert
        should review them before any real use.
      </p>
    </div>
  );
}
