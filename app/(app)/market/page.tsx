import type { Crop } from "@prisma/client";
import Link from "next/link";
import { SourceBadge } from "@/components/SourceBadge";
import { StatusPill } from "@/components/StatusPill";
import { Icon } from "@/components/ui/icons";
import { LiveChip } from "@/components/ui/primitives";
import { requireFarm, requireUser } from "@/lib/auth/guard";
import { cropField } from "@/lib/auth/validation";
import { MARKET } from "@/lib/config";
import { db } from "@/lib/db";
import { catalogFor, CATALOG } from "@/lib/market/catalog";
import { formatDayLong, todayInTz } from "@/lib/market/dates";
import { marketProvider } from "@/lib/market/provider";
import { sellWindow } from "@/lib/sellWindow";
import { cropIdentity, tileClasses } from "@/lib/crop-identity";
import { listStock } from "@/lib/stock/service";
import { stockValueKobo } from "@/lib/stock/value";
import { formatNaira, formatSignedPercent } from "@/lib/format";
import { PriceHistoryPanel } from "./PriceHistoryPanel";

const DAY_CHOICES = [7, 30, 90] as const;

export const dynamic = "force-dynamic";
export const metadata = { title: "Market · AgriPrice" };

/**
 * Market (crop_prices_simple screen): a header panel with the recommended
 * action, one big price card per crop with its trend and the farmer's advice,
 * the line/bar/table history panel, and the stock-value strip.
 *
 * The advice on each card is the same sellWindow used everywhere else, fed by
 * the farm's own stock and costs — the answer never differs between pages.
 */
export default async function MarketPage({
  searchParams,
}: {
  searchParams: { crop?: string; days?: string };
}) {
  const user = await requireUser();
  const farm = await requireFarm(user.id);
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

  const [latest, stockItems, costRows, history] = await Promise.all([
    provider.latestPrices(today).catch(() => null),
    listStock(db, user.id).catch(() => []),
    // Costs belong to this farmer's farm only (docs/00-global.md §2).
    db.costSetting.findMany({ where: { farmId: farm.id } }).catch(() => []),
    provider.history(selected, today, days).catch(() => null),
  ]);
  const costs = costRows;

  // One 14-day history per crop so every card can carry the real advice.
  const decisions = await Promise.all(
    CATALOG.map(async (entry) => {
      const [hist, qty] = await Promise.all([
        provider.history(entry.crop, today, MARKET.trendDays).catch(() => null),
        Promise.resolve(stockItems.find((item) => item.crop === entry.crop)?.qtyKg ?? 0),
      ]);
      const prices = hist?.ticks.map((tick) => tick.priceKobo) ?? [];
      const cost = costs.find((c) => c.crop === entry.crop) ?? null;
      return { entry, result: sellWindow(prices, qty, cost), qty };
    }),
  );

  const tickByCrop = new Map((latest?.ticks ?? []).map((tick) => [tick.crop, tick] as const));
  const decisionByCrop = new Map(decisions.map((d) => [d.entry.crop, d] as const));

  const entry = catalogFor(selected);
  const points = (history?.ticks ?? []).map((tick) => ({
    date: tick.date,
    priceKobo: tick.priceKobo,
  }));

  const totalValue = decisions.reduce((sum, d) => {
    const tick = tickByCrop.get(d.entry.crop);
    return sum + (tick ? stockValueKobo(d.qty, tick.priceKobo) : 0);
  }, 0);

  const sellList = decisions.filter((d) => d.result.status === "SELL_NOW").map((d) => d.entry.label);
  const holdList = decisions.filter((d) => d.result.status === "HOLD").map((d) => d.entry.label);
  const recommended =
    sellList.length > 0
      ? `Sell ${sellList.slice(0, 2).join(", ")} now`
      : holdList.length > 0
        ? `Hold ${holdList.slice(0, 2).join(", ")}`
        : "No decision yet";

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------- 1. header panel */}
      <section className="panel-lg flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">
              🌾
            </span>
            <span className="chip border-leaf-300 bg-leaf-50 font-bold uppercase tracking-wider text-brand">
              Easy grain selling guide
            </span>
          </div>
          <h1 className="display text-display-md text-ink">Today&apos;s crop selling prices</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[15px] text-ink-muted">
            <span className="h-2.5 w-2.5 rounded-full bg-optimal" aria-hidden="true" />
            Updated for {formatDayLong(today)}.{" "}
            <span className="font-semibold text-brand">
              {sellList.length > 0
                ? `${sellList.length} crop${sellList.length === 1 ? "" : "s"} to sell today.`
                : "Prices are steady today."}
            </span>
          </p>
        </div>

        <div className="shrink-0 rounded-panel border border-leaf-200 bg-leaf-50 px-4 py-2.5 text-center">
          <span className="micro block text-ink-muted">Recommended action</span>
          <span className="text-[15px] font-bold text-brand">{recommended}</span>
        </div>
      </section>

      {/* ---------------------------------------------- 2. price cards */}
      {!latest ? (
        <div className="panel">
          <p className="font-medium">Prices are unavailable right now.</p>
          <p className="mt-1 text-ink-muted">Try again in a moment. The rest of the app still works.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {CATALOG.map((item) => {
            const tick = tickByCrop.get(item.crop) ?? null;
            const decision = decisionByCrop.get(item.crop);
            const identity = cropIdentity(item.crop);
            const current = item.crop === selected;

            // Trend from the last two prices of the 14-day history.
            const trend = decision?.result.weeklyTrendPct ?? 0;
            const rising = trend > 0.05;
            const falling = trend < -0.05;

            return (
              <li key={item.crop}>
                <Link
                  href={`/market?crop=${item.crop}&days=${days}`}
                  aria-current={current ? "page" : undefined}
                  className={`flex h-full flex-col justify-between rounded-panel border p-6 transition-all ${
                    current ? "border-leaf-300 bg-leaf-50/60" : "border-line bg-surface hover:border-line-strong"
                  }`}
                >
                  <div>
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-tile text-3xl shadow-inner ${tileClasses(
                          identity.tone,
                        )}`}
                        aria-hidden="true"
                      >
                        {identity.emoji}
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-headline-lg text-ink">{item.label}</h2>
                        <span className="text-[13px] text-ink-muted">{identity.subtitle}</span>
                      </div>
                    </div>

                    <div className="my-4">
                      <div className="flex items-baseline gap-2">
                        <span className="display tabular text-readout text-ink">
                          {tick ? formatNaira(tick.priceKobo) : "—"}
                        </span>
                        <span className="text-[17px] font-medium text-ink-muted">/ {item.unitLabel}</span>
                      </div>

                      <span
                        className={`chip mt-3 font-bold ${
                          rising
                            ? "border-leaf-200 bg-leaf-50 text-brand"
                            : falling
                              ? "border-warn-line bg-warn-bg text-warn-text"
                              : "border-line bg-surface-dim text-ink-muted"
                        }`}
                      >
                        <Icon name={rising ? "trendUp" : falling ? "trendDown" : "trendFlat"} className="h-4 w-4" />
                        {rising
                          ? `Price is up (+${formatSignedPercent(trend)})`
                          : falling
                            ? `Price down a little (${formatSignedPercent(trend)})`
                            : "Price holding steady"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
                    <span className="micro">Farmer advice</span>
                    {decision && <StatusPill status={decision.result.status} />}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* ------------------------------------------- 3. range switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <LiveChip className="hidden sm:inline-flex">Live feed</LiveChip>
          <span className="text-[13px] text-ink-muted">
            The simulated feed is deterministic, so the same day always shows the same price.
          </span>
        </div>
        <nav aria-label="Chart range" className="flex gap-1 rounded-panel border border-line bg-surface-lower p-1">
          {DAY_CHOICES.map((choice) => {
            const current = choice === days;
            return (
              <Link
                key={choice}
                href={`/market?crop=${selected}&days=${choice}`}
                aria-current={current ? "page" : undefined}
                className={`tab-btn min-h-[40px] ${current ? "tab-btn-on" : "tab-btn-off"}`}
              >
                {choice} days
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ------------------------------------------- 4. history panel */}
      <PriceHistoryPanel points={points} cropLabel={entry.label} unitLabel={entry.unitLabel} />

      {/* ------------------------------------------- 5. stock value strip */}
      <section className="panel flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-tile border border-leaf-200 bg-leaf-50 text-2xl">
            💰
          </span>
          <div>
            <span className="micro">Estimated total value of your grain right now</span>
            <p className="display text-headline-lg tabular text-ink">{formatNaira(totalValue)}</p>
          </div>
        </div>
        <div className="text-[13px] text-ink-muted md:text-right">
          <span>
            Calculated from your stock at today&apos;s {entry.label} price basis · as of{" "}
            {formatDayLong(today)}
          </span>
          <p className="mt-0.5">
            <SourceBadge kind="simulated" />
          </p>
        </div>
      </section>
    </div>
  );
}
