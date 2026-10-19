import type { Crop } from "@prisma/client";
import Link from "next/link";
import { cropField } from "@/lib/auth/validation";
import { requireFarm, requireUser } from "@/lib/auth/guard";
import { SELL_WINDOW, MARKET } from "@/lib/config";
import { costForUser } from "@/lib/costs/service";
import { db } from "@/lib/db";
import { CATALOG, catalogFor } from "@/lib/market/catalog";
import { todayInTz } from "@/lib/market/dates";
import { marketProvider } from "@/lib/market/provider";
import { listStock } from "@/lib/stock/service";
import { CostsForm } from "./CostsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cost of waiting · AgriPrice" };

/**
 * Cost-of-waiting page (docs/01-agriprice.md, "Costs").
 * One crop at a time, picked with the chips. The form shows a live sellWindow
 * preview of whatever is typed; only Save costs writes to CostSetting, and
 * only for the signed-in farmer's farm.
 */
export default async function CostsPage({
  searchParams,
}: {
  searchParams: { crop?: string };
}) {
  const user = await requireUser();
  await requireFarm(user.id);
  const today = todayInTz();

  const stockItems = await listStock(db, user.id);
  const inStock = new Set<Crop>(stockItems.map((item) => item.crop));

  let selected: Crop | null = null;
  let unknownCrop = false;
  if (typeof searchParams.crop === "string" && searchParams.crop.length > 0) {
    const parsed = cropField.safeParse(searchParams.crop);
    if (parsed.success) selected = parsed.data;
    else unknownCrop = true;
  }
  if (!selected) selected = stockItems[0]?.crop ?? CATALOG[0].crop;

  const provider = marketProvider();
  const [history, cost] = await Promise.all([
    provider.history(selected, today, MARKET.trendDays),
    costForUser(db, user.id, selected),
  ]);

  const pricesKobo = history.ticks.map((tick) => tick.priceKobo);
  const latestKobo = pricesKobo[pricesKobo.length - 1] ?? 0;
  const qtyKg = stockItems.find((item) => item.crop === selected)?.qtyKg ?? 0;
  const entry = catalogFor(selected);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Cost of waiting</h1>
        <p className="text-muted">
          Storage, spoilage and your minimum gain — the answer updates as you type.
        </p>
      </header>

      {unknownCrop && (
        <p
          role="alert"
          className="rounded-input border border-warning bg-warning-bg px-3 py-2 text-warning"
        >
          That crop is not in the catalog. Showing {entry.label} instead.
        </p>
      )}

      <nav aria-label="Choose a crop" className="flex flex-wrap gap-2">
        {CATALOG.map((item) => {
          const current = item.crop === selected;
          return (
            <Link
              key={item.crop}
              href={`/costs?crop=${item.crop}`}
              aria-current={current ? "page" : undefined}
              className={`inline-flex min-h-[48px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                current
                  ? "border-accent/40 bg-success-bg text-accent"
                  : "border-border bg-surface text-muted hover:bg-bg hover:text-text"
              }`}
            >
              {item.label}
              {inStock.has(item.crop) && (
                <span className="text-muted" aria-hidden="true">
                  · in stock
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <CostsForm
        crop={selected}
        label={entry.label}
        unitLabel={entry.unitLabel}
        pricesKobo={pricesKobo}
        qtyKg={qtyKg}
        latestKobo={latestKobo}
        initial={
          cost
            ? {
                storageNaira: cost.storageKoboPerKgPerWeek / 100,
                spoilagePctPerWeek: cost.spoilagePctPerWeek,
                minGainPct: cost.minGainPct,
              }
            : {
                storageNaira: 0,
                spoilagePctPerWeek: 0,
                minGainPct: SELL_WINDOW.minGainPct,
              }
        }
      />

      <p className="text-sm text-muted">
        Saved costs feed the sell-or-hold answer on the dashboard and on each crop page. Sample
        numbers — an expert must review them before any real use.
      </p>
    </div>
  );
}
