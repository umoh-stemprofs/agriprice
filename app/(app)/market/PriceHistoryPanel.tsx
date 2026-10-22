"use client";

import { useMemo, useState } from "react";
import { PriceLineChart } from "@/components/charts/PriceLineChart";
import { Icon } from "@/components/ui/icons";
import type { PricePoint } from "@/lib/charts/series";
import { formatNaira } from "@/lib/format";
import { formatDayShort } from "@/lib/market/dates";

/**
 * Price history panel with the design's segmented view switcher
 * (crop_prices_simple): Line Chart / Bar Chart / Table over the same points.
 *
 * The bar view buckets the range into weeks (or days when the range is under
 * two weeks) and shows the average of each bucket, so the bars are real
 * aggregates of the very same series the line draws — not decoration.
 */

type View = "line" | "bar" | "table";

interface Bucket {
  label: string;
  sub: string;
  avgKobo: number;
}

function bucket(points: readonly PricePoint[], perBucket: number): Bucket[] {
  const buckets: Bucket[] = [];
  for (let i = 0; i < points.length; i += perBucket) {
    const slice = points.slice(i, i + perBucket);
    if (slice.length === 0) continue;
    const avg = Math.round(slice.reduce((sum, p) => sum + p.priceKobo, 0) / slice.length);
    buckets.push({
      label: formatNaira(avg),
      sub: formatDayShort(slice[0].date),
      avgKobo: avg,
    });
  }
  return buckets;
}

export function PriceHistoryPanel({
  points,
  cropLabel,
  unitLabel,
}: {
  points: readonly PricePoint[];
  cropLabel: string;
  unitLabel: string;
}) {
  const [view, setView] = useState<View>("line");

  const buckets = useMemo(
    () => bucket(points, points.length > 14 ? 7 : 1),
    [points],
  );
  const max = Math.max(...buckets.map((b) => b.avgKobo), 1);
  const min = Math.min(...buckets.map((b) => b.avgKobo), 0);
  const spread = Math.max(max - min, 1);

  const first = points[0];
  const last = points[points.length - 1];
  const change = first && last && first.priceKobo > 0
    ? ((last.priceKobo - first.priceKobo) / first.priceKobo) * 100
    : null;

  const tabs: { id: View; label: string; icon: "trendUp" | "stock" | "costs" }[] = [
    { id: "line", label: "Line Chart", icon: "trendUp" },
    { id: "bar", label: "Bar Chart", icon: "stock" },
    { id: "table", label: "Table", icon: "costs" },
  ];

  return (
    <section className="panel" aria-label={`${cropLabel} price history`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-headline-lg text-ink">
            Is the price going up or down? (Past {points.length} Days)
          </h2>
          <p className="mt-1 text-[14px] text-ink-muted">
            Here is the {points.length}-day story for your {cropLabel.toLowerCase()} crop. No
            confusing financial charts.
          </p>
        </div>
        {first && last && (
          <div className="flex items-center gap-3 rounded-panel border border-leaf-200 bg-leaf-50 px-4 py-2.5">
            <div>
              <span className="micro block">First day</span>
              <span className="text-[15px] font-bold text-ink tabular">
                {formatNaira(first.priceKobo)}
              </span>
            </div>
            <Icon name="chevronRight" className="h-4 w-4 text-brand" />
            <div>
              <span className="micro block">Today</span>
              <span className="text-[15px] font-bold text-ink tabular">
                {formatNaira(last.priceKobo)}
              </span>
            </div>
            <span className="chip border-leaf-300 bg-leaf-600 font-bold text-white">
              {change === null ? "No change" : change > 0 ? "Going up!" : change < 0 ? "Going down" : "Holding"}
            </span>
          </div>
        )}
      </div>

      {/* segmented view switcher */}
      <div
        role="tablist"
        aria-label="Chart view"
        className="mt-5 flex flex-wrap gap-1 rounded-panel border border-line bg-surface-lower p-1"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={view === tab.id}
            onClick={() => setView(tab.id)}
            className={`tab-btn min-h-[40px] ${
              view === tab.id ? "tab-btn-on" : "tab-btn-off"
            }`}
          >
            <Icon name={tab.icon} className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {points.length === 0 ? (
        <div className="mt-4 rounded-panel border border-line p-6 text-center">
          <p className="font-medium">No prices in this range yet.</p>
          <p className="mt-1 text-ink-muted">Try a longer range.</p>
        </div>
      ) : (
        <div className="mt-4">
          {view === "line" && <PriceLineChart actual={points} />}

          {view === "bar" && (
            <div>
              <div className="flex h-[240px] items-end gap-2 rounded-panel border border-leaf-100 bg-gradient-to-b from-leaf-50/60 to-transparent p-4">
                {buckets.map((b, index) => {
                  const height = 18 + ((b.avgKobo - min) / spread) * 180;
                  const isLast = index === buckets.length - 1;
                  return (
                    <div key={`${b.sub}-${index}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                      <span
                        className={`text-[12px] font-bold tabular ${
                          isLast ? "text-brand" : "text-ink"
                        }`}
                      >
                        {b.label}
                      </span>
                      <div
                        className={`w-full max-w-[80px] rounded-t-panel transition-colors ${
                          isLast ? "bg-brand" : "bg-leaf-200 hover:bg-leaf-300"
                        }`}
                        style={{ height: `${height}px` }}
                      />
                      <span className={`text-[11px] ${isLast ? "font-bold text-brand" : "text-ink-muted"}`}>
                        {b.sub}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[13px] text-ink-muted">
                Average {cropLabel} price per {unitLabel}, {buckets.length === 1 ? "one period" : `${buckets.length} periods`} across
                this range.
              </p>
            </div>
          )}

          {view === "table" && (
            <div className="max-h-[320px] overflow-auto rounded-panel border border-line">
              <table className="data-table">
                <caption className="sr-only">{cropLabel} prices, last {points.length} days</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col" className="text-right">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...points].reverse().map((point) => (
                    <tr key={point.date}>
                      <td>{formatDayShort(point.date)}</td>
                      <td className="num">{formatNaira(point.priceKobo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {first && last && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-[13px] font-semibold text-ink-muted">
          <div>
            <span className="micro block">{points.length} days ago</span>
            <span className="text-ink tabular">{formatNaira(first.priceKobo)} / {unitLabel}</span>
          </div>
          {change !== null && (
            <span className="chip border-leaf-200 bg-leaf-50 font-bold text-brand">
              <Icon name={change >= 0 ? "trendUp" : "trendDown"} className="h-4 w-4" />
              {change >= 0 ? "+" : ""}
              {change.toFixed(1)}% across this range
            </span>
          )}
          <div className="text-right">
            <span className="micro block">Today&apos;s price</span>
            <span className="text-brand tabular">{formatNaira(last.priceKobo)} / {unitLabel}</span>
          </div>
        </div>
      )}
    </section>
  );
}
