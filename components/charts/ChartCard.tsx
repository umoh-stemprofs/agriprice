"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SourceBadge, type BadgeKind } from "@/components/SourceBadge";

/**
 * Every chart in the app sits in this card (docs/design.md §2 Chart card and
 * §4): title, data-source badge, "View as table", an empty state when there is
 * nothing to chart, and a skeleton until the chart has mounted on the client.
 * The table is the accessible version of the same numbers, so a chart is never
 * the only way to read the data.
 */

export interface ChartTable {
  headers: string[];
  rows: string[][];
}

export function ChartCard({
  title,
  subtitle,
  badge = "simulated",
  table,
  emptyMessage = "No data to chart yet.",
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: BadgeKind;
  table: ChartTable;
  emptyMessage?: string;
  /** The chart itself; rendered only after mount, so SSR stays predictable. */
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [showTable, setShowTable] = useState(false);
  useEffect(() => setMounted(true), []);

  const empty = table.rows.length === 0;

  return (
    <section className="card" aria-label={title}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {subtitle && <p className="text-muted">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge kind={badge} />
          {!empty && (
            <button
              type="button"
              className="btn-ghost px-3 text-sm"
              aria-expanded={showTable}
              onClick={() => setShowTable((open) => !open)}
            >
              {showTable ? "View as chart" : "View as table"}
            </button>
          )}
        </div>
      </div>

      {empty ? (
        <div className="mt-4 rounded-card border border-border p-6 text-center">
          <p className="font-medium">Nothing to show yet.</p>
          <p className="mt-1 text-muted">{emptyMessage}</p>
        </div>
      ) : showTable ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr className="border-b border-border">
                {table.headers.map((header) => (
                  <th key={header} scope="col" className="py-2 pr-4 font-medium text-muted">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border last:border-b-0">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="py-2 pr-4 tabular-nums">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !mounted ? (
        <div className="mt-4">
          <p className="sr-only">Loading chart…</p>
          <div
            aria-hidden="true"
            className="h-[260px] animate-pulse rounded-card border border-border bg-bg"
          />
        </div>
      ) : (
        <div className="mt-4">{children}</div>
      )}
    </section>
  );
}
