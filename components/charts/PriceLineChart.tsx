"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS_TICK, GRID_COLOR, SERIES_COLORS } from "@/lib/charts/palette";
import type { PricePoint } from "@/lib/charts/series";
import { formatNaira } from "@/lib/format";
import { formatDayShort } from "@/lib/market/dates";

/**
 * Daily price line with an optional dotted next-week projection
 * (docs/01-agriprice.md crop detail, docs/design.md §4: light gridlines,
 * tooltip, units on axes, axis text 12 px). The two series share one date row,
 * so the dotted line starts exactly where the solid one stops.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Compact axis label: "19 Oct" — six characters so it survives a 390 px screen. */
function shortLabel(dateOnly: string): string {
  const day = Number(dateOnly.slice(8, 10));
  const month = MONTHS[Number(dateOnly.slice(5, 7)) - 1] ?? "";
  return `${day} ${month}`;
}

interface Row {
  date: string;
  price: number | null;
  projected: number | null;
}

function buildRows(
  actual: readonly PricePoint[],
  projection: readonly PricePoint[],
): Row[] {
  const rows: Row[] = actual.map((point) => ({
    date: point.date,
    price: point.priceKobo,
    projected: null,
  }));

  if (projection.length > 0) {
    const [first, ...rest] = projection;
    const onLastActual = rows[rows.length - 1];
    if (onLastActual && onLastActual.date === first.date) {
      onLastActual.projected = first.priceKobo;
    } else {
      rows.push({ date: first.date, price: null, projected: first.priceKobo });
    }

    for (const point of rest) {
      const existing = rows.find((row) => row.date === point.date);
      if (existing) existing.projected = point.priceKobo;
      else rows.push({ date: point.date, price: null, projected: point.priceKobo });
    }
  }

  return rows;
}

export function PriceLineChart({
  actual,
  projection = [],
  height = 260,
}: {
  actual: readonly PricePoint[];
  projection?: readonly PricePoint[];
  height?: number;
}) {
  const rows = buildRows(actual, projection);
  const hasProjection = projection.length > 0;
  // About six labels across, whatever the screen size.
  const interval = rows.length > 8 ? Math.ceil(rows.length / 6) - 1 : 0;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 24, bottom: 4, left: 4 }}>
          <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={AXIS_TICK}
            tickFormatter={(value: string) => shortLabel(value)}
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
            interval={interval}
            minTickGap={8}
          />
          <YAxis
            tick={AXIS_TICK}
            tickFormatter={(value: number) => formatNaira(Number(value))}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip
            labelFormatter={(label) => formatDayShort(String(label ?? ""))}
            formatter={(value, name): [string, string] =>
              value == null
                ? ["No data", String(name)]
                : [formatNaira(Number(value)), String(name)]
            }
          />
          {hasProjection && <Legend wrapperStyle={{ fontSize: 12 }} />}
          <Line
            type="monotone"
            dataKey="price"
            name="Price"
            stroke={SERIES_COLORS[0]}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          {hasProjection && (
            <Line
              type="monotone"
              dataKey="projected"
              name="Next week (projected)"
              stroke={SERIES_COLORS[1]}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 3, fill: SERIES_COLORS[1] }}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
