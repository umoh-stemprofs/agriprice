import { SourceBadge } from "@/components/SourceBadge";
import { requireFarm, requireUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { formatDayLong, todayInTz } from "@/lib/market/dates";
import { CATALOG, catalogFor } from "@/lib/market/catalog";
import { marketProvider } from "@/lib/market/provider";
import { listStock } from "@/lib/stock/service";
import { stockValueKobo, totalQtyKg } from "@/lib/stock/value";
import { formatKg, formatNaira } from "@/lib/format";
import { StockManager, type StockRowView } from "./StockManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stock · AgriPrice" };

export default async function StockPage() {
  const user = await requireUser();
  const farm = await requireFarm(user.id);
  const today = todayInTz();

  const [market, items] = await Promise.all([
    marketProvider().latestPrices(today).catch(() => null),
    listStock(db, user.id),
  ]);

  const priceByCrop = new Map((market?.ticks ?? []).map((tick) => [tick.crop, tick] as const));

  const rows: StockRowView[] = items.map((item) => {
    const entry = catalogFor(item.crop);
    const tick = priceByCrop.get(item.crop) ?? null;
    return {
      id: item.id,
      crop: item.crop,
      label: entry.label,
      unitLabel: entry.unitLabel,
      qtyKg: item.qtyKg,
      note: item.note,
      priceKobo: tick?.priceKobo ?? null,
      valueKobo: tick ? stockValueKobo(item.qtyKg, tick.priceKobo) : null,
    };
  });

  const totalValue = rows.reduce((sum, row) => sum + (row.valueKobo ?? 0), 0);
  const totalKg = totalQtyKg(rows);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Stock</h1>
        <p className="text-muted">
          {farm.name} · what you hold and what it is worth today.
        </p>
      </header>

      <section aria-labelledby="total-value-title" className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="total-value-title" className="text-sm font-medium text-muted">
              Estimated market value
            </h2>
            <p className="mt-2 text-4xl font-bold leading-10 tabular-nums">{formatNaira(totalValue)}</p>
            <p className="mt-1 text-sm text-muted">
              {formatKg(totalKg)} across {rows.length} crop{rows.length === 1 ? "" : "s"} · as of{" "}
              {formatDayLong(today)}
            </p>
          </div>
          <SourceBadge kind="simulated" />
        </div>
        {!market && (
          <p className="mt-4 rounded-input border border-warning bg-warning-bg px-3 py-2 text-warning">
            Prices are unavailable right now, so values are blank. Your stock is still saved.
          </p>
        )}
      </section>

      <StockManager
        rows={rows}
        crops={CATALOG.map((entry) => ({ crop: entry.crop, label: entry.label }))}
      />
    </div>
  );
}
