import { SourceBadge } from "@/components/SourceBadge";
import { requireUser } from "@/lib/auth/guard";
import { MARKET } from "@/lib/config";
import { catalogFor, CATALOG } from "@/lib/market/catalog";
import { formatDayLong, todayInTz } from "@/lib/market/dates";
import { marketProvider } from "@/lib/market/provider";
import { formatNaira, formatSignedPercent } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Market · AgriPrice" };

export default async function MarketPage() {
  await requireUser();
  const today = todayInTz();
  const provider = marketProvider();

  const [latest, changes] = await Promise.all([
    provider.latestPrices(today).catch(() => null),
    Promise.all(
      CATALOG.map(async (entry) => {
        const history = await provider
          .history(entry.crop, today, 2)
          .catch(() => null);
        const prices = history?.ticks.map((tick) => tick.priceKobo) ?? [];
        const yesterday = prices.length === 2 ? prices[0] : null;
        const current = prices.length > 0 ? prices[prices.length - 1] : null;
        if (!yesterday || !current || yesterday === 0) return [entry.crop, null] as const;
        return [entry.crop, ((current - yesterday) / yesterday) * 100] as const;
      }),
    ),
  ]);

  const changeByCrop = new Map(changes);
  const tickByCrop = new Map((latest?.ticks ?? []).map((tick) => [tick.crop, tick] as const));

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
          {CATALOG.map((entry) => {
            const tick = tickByCrop.get(entry.crop) ?? null;
            const change = changeByCrop.get(entry.crop) ?? null;
            const rising = change !== null && change > 0;
            const falling = change !== null && change < 0;

            return (
              <li key={entry.crop} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{entry.label}</p>
                    <p className="text-sm text-muted">per {entry.unitLabel}</p>
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

      <p className="text-sm text-muted">
        Base prices are sample numbers in{" "}
        <code className="rounded bg-surface px-1 py-0.5">lib/market/catalog.ts</code>. An expert
        should review them before any real use.
      </p>
    </div>
  );
}
