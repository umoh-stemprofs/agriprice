import type { Crop } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChartCard } from "@/components/charts/ChartCard";
import { PriceLineChart } from "@/components/charts/PriceLineChart";
import { MoneyLine } from "@/components/MoneyLine";
import { SourceBadge } from "@/components/SourceBadge";
import { StatusPill } from "@/components/StatusPill";
import { Icon } from "@/components/ui/icons";
import { cropIdentity, tileClasses } from "@/lib/crop-identity";
import { cropField } from "@/lib/auth/validation";
import { requireFarm, requireUser } from "@/lib/auth/guard";
import { MARKET } from "@/lib/config";
import { projectionSeries, type PricePoint } from "@/lib/charts/series";
import { costForUser } from "@/lib/costs/service";
import { db } from "@/lib/db";
import { formatKg, formatNaira, formatSignedPercent } from "@/lib/format";
import { catalogFor } from "@/lib/market/catalog";
import { formatDayLong, formatDayShort, todayInTz } from "@/lib/market/dates";
import { marketProvider } from "@/lib/market/provider";
import { listStock } from "@/lib/stock/service";
import { sellWindow } from "@/lib/sellWindow";

export const dynamic = "force-dynamic";

function SmallCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-panel border border-line bg-surface p-5">
      <p className="micro">{label}</p>
      <p className="mt-1.5 display text-metric-sm tabular text-ink">{value}</p>
      <p className="mt-1 text-[13px] text-ink-muted">{hint}</p>
    </div>
  );
}

/**
 * Crop detail (docs/01-agriprice.md, page 3): header with the crop name, a
 * big status pill, one sentence why and the money, then a 30-day line with the
 * next week projected as a dotted line, plus trend / cost of waiting / value
 * of your stock. Same sellWindow, same prices and same costs as everywhere
 * else — the answer never changes between pages.
 */
export default async function CropDetailPage({ params }: { params: { crop: string } }) {
  const parsed = cropField.safeParse(params.crop);
  if (!parsed.success) redirect("/dashboard");
  const crop: Crop = parsed.data;

  const user = await requireUser();
  await requireFarm(user.id);
  const today = todayInTz();

  const provider = marketProvider();
  const [history, cost, stockItems] = await Promise.all([
    provider.history(crop, today, MARKET.defaultHistoryDays),
    costForUser(db, user.id, crop),
    listStock(db, user.id),
  ]);

  const points: PricePoint[] = history.ticks.map((tick) => ({
    date: tick.date,
    priceKobo: tick.priceKobo,
  }));
  const prices14 = points.slice(-MARKET.trendDays).map((point) => point.priceKobo);
  const qtyKg = stockItems.find((item) => item.crop === crop)?.qtyKg ?? 0;

  const result = sellWindow(prices14, qtyKg, cost);
  const entry = catalogFor(crop);

  // No projection when there is nothing to project from: the dotted line must
  // never invent a price (docs/design.md §4).
  const series = projectionSeries(
    points.map((point) => point.priceKobo),
    points.map((point) => point.date),
    result.status === "NEED_DATA" ? null : result.weeklyTrendPct,
  );

  const latestKobo = result.latestKobo;
  const projectionEnd = series.projection[series.projection.length - 1];

  const table = {
    headers: ["Date", "Price"],
    rows: [
      ...series.actual.map((point) => [formatDayShort(point.date), formatNaira(point.priceKobo)]),
      ...(projectionEnd && series.projection.length === 2
        ? [[formatDayShort(projectionEnd.date), `${formatNaira(projectionEnd.priceKobo)} (projected)`]]
        : []),
    ] as string[][],
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/market"
            className="inline-flex items-center gap-1 text-label-md text-ink-muted hover:text-ink"
          >
            <Icon name="chevronRight" className="h-4 w-4 rotate-180" />
            Market
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <span
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-tile text-3xl ${tileClasses(
                cropIdentity(crop).tone,
              )}`}
              aria-hidden="true"
            >
              {cropIdentity(crop).emoji}
            </span>
            <div className="min-w-0">
              <p className="text-label-sm uppercase tracking-wider text-ink-muted">Crop</p>
              <h1 className="display text-display-md text-ink">{entry.label}</h1>
            </div>
          </div>
          <p className="mt-2 text-[15px] text-ink-muted tabular">
            {formatKg(qtyKg)} in stock · {formatNaira(latestKobo)} / {entry.unitLabel} as of{" "}
            {formatDayLong(today)}
          </p>
        </div>
        <Link href={`/costs?crop=${crop}`} className="btn-primary">
          Set costs
        </Link>
      </header>

      <section className="panel-lg" aria-label="Sell or hold decision">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <StatusPill status={result.status} size="lg" />
          <SourceBadge kind="simulated" />
        </div>
        <p className="mt-4 text-lg">{result.message}</p>
        <MoneyLine status={result.status} changeIfWaitKobo={result.changeIfWaitKobo} />
        {result.costsNotSet && (
          <p className="mt-2 text-sm">
            <Link href={`/costs?crop=${crop}`} className="font-medium text-brand underline">
              Set costs
            </Link>{" "}
            <span className="text-ink-muted">so the cost of holding is counted.</span>
          </p>
        )}
        {qtyKg === 0 && (
          <p className="mt-2 text-sm text-ink-muted">
            You do not hold this crop right now, so the money line reads ₦0.{" "}
            <Link href="/stock#add-stock" className="font-medium text-brand underline">
              Add stock
            </Link>
          </p>
        )}
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard
            title="Price, last 30 days"
            subtitle="Solid: real prices · dotted: next week projected"
            table={table}
            emptyMessage="This crop has no price history yet."
          >
            <PriceLineChart actual={series.actual} projection={series.projection} />
          </ChartCard>
        </div>

        <div className="grid gap-4">
          <SmallCard
            label="Weekly trend"
            value={formatSignedPercent(result.weeklyTrendPct)}
            hint="Expected move over one week"
          />
          <SmallCard
            label="Cost of waiting"
            value={`${formatNaira(result.holdCostPerKgKobo)} / kg`}
            hint={
              result.costsNotSet
                ? "Costs not set, so storage and spoilage count as nothing"
                : "Storage plus spoilage for one week"
            }
          />
          <SmallCard
            label="Value of your stock"
            value={formatNaira(result.stockValueNowKobo)}
            hint={`${formatKg(qtyKg)} at today's price`}
          />
        </div>
      </div>
    </div>
  );
}
