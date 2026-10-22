import { SourceBadge } from "@/components/SourceBadge";
import { Icon } from "@/components/ui/icons";
import { CapacityGauge, SectionHead, Tile } from "@/components/ui/primitives";
import { requireFarm, requireUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { formatDayLong, todayInTz } from "@/lib/market/dates";
import { CATALOG, catalogFor } from "@/lib/market/catalog";
import { marketProvider } from "@/lib/market/provider";
import { listStock } from "@/lib/stock/service";
import { stockValueKobo, totalQtyKg } from "@/lib/stock/value";
import { cropIdentity, tileClasses } from "@/lib/crop-identity";
import { formatKg, formatNaira } from "@/lib/format";
import { StockManager, type StockRowView } from "./StockManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stock · AgriPrice" };

/**
 * Stock page, rebuilt to the grain_storage_simple screen:
 *   title + primary action, one giant total card, a card per crop with its
 *   value, quantity and share of the total, then the storage summary bar.
 *
 * The design's silo capacity bars would be invented data here (the app does
 * not track bin sizes), so each card shows its real share of the stock value
 * instead, and the summary bar adds up what the farm actually holds.
 */
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
  const shareOf = (value: number | null) =>
    totalValue > 0 && value !== null ? (value / totalValue) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* ---------------------------------------------------- 1. title */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-display-md text-ink">Grain in your stock</h1>
          <p className="mt-1 text-[17px] text-ink-muted">
            Total value of your crops · {farm.name}
          </p>
        </div>
        <a href="#add-stock" className="btn-primary">
          <Icon name="add" className="h-4 w-4" />
          Add stored grain
        </a>
      </header>

      {/* -------------------------------------------- 2. giant total card */}
      <section className="panel-lg relative overflow-hidden" aria-labelledby="total-value-title">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 -right-8 h-64 w-64 rounded-full bg-leaf-50 opacity-60"
        />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <span id="total-value-title" className="micro">
              Total grain value in cash
            </span>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="display tabular text-readout-lg text-brand">
                {formatNaira(totalValue)}
              </span>
              <span className="text-headline-md font-bold text-ink-muted">NGN</span>
            </div>
          </div>

          <div className="inline-flex shrink-0 items-center gap-2.5 self-start rounded-hero border border-leaf-200 bg-leaf-50 px-5 py-3 text-brand md:self-center">
            <Icon name="warehouse" className="h-6 w-6" />
            <span className="text-[15px] font-bold tabular">
              {formatKg(totalKg)} stored across {rows.length} crop{rows.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        {!market && (
          <p className="relative z-10 mt-4 rounded-input border border-warn-line bg-warn-bg px-3 py-2 text-warn-text">
            Prices are unavailable right now, so values are blank. Your stock is still saved.
          </p>
        )}
      </section>

      {/* ------------------------------------------- 3. crop cards */}
      <section className="flex flex-col gap-4" aria-labelledby="stored-title">
        <SectionHead
          id="stored-title"
          title="Crops currently stored"
          note={
            rows.length === 0
              ? "Nothing stored yet"
              : `${rows.length} active entr${rows.length === 1 ? "y" : "ies"}`
          }
        />

        {rows.length === 0 ? (
          <div className="rounded-hero border border-line bg-surface p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-tile bg-leaf-100 text-brand">
              <Icon name="grain" className="h-7 w-7" />
            </span>
            <p className="mt-4 font-semibold">No grain stored yet.</p>
            <p className="mt-1 text-ink-muted">
              Add what you are holding and every screen will price it.
            </p>
            <a href="#add-stock" className="btn-primary mt-4">
              <Icon name="add" className="h-4 w-4" />
              Add stored grain
            </a>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {rows.map((row) => {
              const identity = cropIdentity(row.crop as never);
              const share = shareOf(row.valueKobo);
              return (
                <li
                  key={row.id}
                  className="flex flex-col justify-between gap-6 rounded-panel border border-line bg-surface p-6 transition-colors hover:border-leaf-300"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Tile tint={identity.tone === "warn" ? "warn" : identity.tone}>
                          <span className="text-3xl">{identity.emoji}</span>
                        </Tile>
                        <div className="min-w-0">
                          <h3 className="truncate text-headline-lg text-ink">{row.label}</h3>
                          <p className="truncate text-[13px] text-ink-muted">
                            {row.note || "No note on this batch"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 rounded-panel border border-line-soft bg-surface-lower p-4">
                      <span className="micro">Estimated cash value</span>
                      <span className="display tabular text-headline-lg text-ink">
                        {row.valueKobo === null ? "—" : formatNaira(row.valueKobo)}
                      </span>
                      <span className="text-[13px] text-ink-muted tabular">
                        {row.priceKobo === null
                          ? "Price unavailable"
                          : `${formatNaira(row.priceKobo)} per ${row.unitLabel}`}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-3 pt-1">
                      <span className="text-[14px] font-medium text-ink-muted">Amount stored</span>
                      <span className="text-headline-md text-ink tabular">
                        {formatKg(row.qtyKg)}
                      </span>
                    </div>

                    <span className="chip border-leaf-200 bg-leaf-50 font-bold text-brand">
                      <Icon name="checkCircle" className="h-4 w-4 text-brand" />
                      {row.priceKobo === null ? "Price pending" : "Priced today"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 border-t border-line-soft pt-4">
                    <div className="flex items-center justify-between text-[12px] font-semibold">
                      <span className="text-ink-muted">
                        {Math.round(share)}% of your stock value
                      </span>
                      <span className="text-ink tabular">
                        {row.valueKobo === null ? "—" : formatNaira(row.valueKobo)}
                      </span>
                    </div>
                    <CapacityGauge pct={share} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ---------------------------------------- 4. storage summary */}
      {rows.length > 0 && (
        <section className="panel flex flex-col gap-4" aria-labelledby="summary-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 id="summary-title" className="text-headline-md text-ink">
                Your stock: {formatKg(totalKg)} held
              </h3>
              <p className="mt-0.5 text-[14px] text-ink-muted">
                Worth {formatNaira(totalValue)} at today&apos;s prices · as of {formatDayLong(today)}
              </p>
            </div>
            <span className="chip border-leaf-200 bg-leaf-50 font-semibold text-brand">
              <span className="h-2 w-2 rounded-full bg-optimal" aria-hidden="true" />
              {rows.length} crop{rows.length === 1 ? "" : "s"} tracked
            </span>
          </div>

          <CapacityGauge pct={100} />

          <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] font-medium text-ink-muted">
            {rows.map((row) => (
              <span key={row.id} className="tabular">
                {row.label}: {formatKg(row.qtyKg)}
              </span>
            ))}
            <span className="font-bold text-ink tabular">{formatNaira(totalValue)} total</span>
          </div>
        </section>
      )}

      {/* ------------------------------------------- 5. per-crop table */}
      <section className="panel" aria-labelledby="breakdown-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="breakdown-title" className="text-headline-md text-ink">
            Value by crop
          </h3>
          <SourceBadge kind="simulated" />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="data-table">
            <caption className="sr-only">Stock value per crop</caption>
            <thead>
              <tr>
                <th scope="col">Crop</th>
                <th scope="col" className="text-right">
                  Quantity
                </th>
                <th scope="col" className="text-right">
                  Price
                </th>
                <th scope="col" className="text-right">
                  Value
                </th>
                <th scope="col" className="text-right">
                  Share
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td className="num">{formatKg(row.qtyKg)}</td>
                  <td className="num">
                    {row.priceKobo === null ? "—" : `${formatNaira(row.priceKobo)}/${row.unitLabel}`}
                  </td>
                  <td className="num font-semibold">
                    {row.valueKobo === null ? "—" : formatNaira(row.valueKobo)}
                  </td>
                  <td className="num">{Math.round(shareOf(row.valueKobo))}%</td>
                </tr>
              ))}
              <tr>
                <td className="font-semibold">Total</td>
                <td className="num font-semibold">{formatKg(totalKg)}</td>
                <td className="num">—</td>
                <td className="num font-semibold">{formatNaira(totalValue)}</td>
                <td className="num font-semibold">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] text-ink-muted">
          Prices come from the {CATALOG.length}-crop catalog and update once a day.
        </p>
      </section>

      <StockManager
        rows={rows}
        crops={CATALOG.map((entry) => ({ crop: entry.crop, label: entry.label }))}
      />
    </div>
  );
}
