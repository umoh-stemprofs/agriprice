"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS_TICK, GRID_COLOR, OTHER_COLOR, SERIES_COLORS } from "@/lib/charts/palette";
import type { ValueSlice } from "@/lib/charts/series";
import { formatNaira } from "@/lib/format";

/**
 * Stock value by crop: the bar chart and the pie from the Agriculture rules
 * (docs/00-global.md §3). Slices arrive already grouped and capped by
 * valueByCrop — pie max 5 slices, the tail as "Other" — and each slice keeps
 * its colour between the two charts, so the bar and the pie read the same.
 */

function toData(slices: readonly ValueSlice[]) {
  return slices.map((slice) => ({
    label: slice.label,
    valueKobo: slice.valueKobo,
    isOther: slice.isOther,
  }));
}

function colorFor(slice: { isOther: boolean }, index: number): string {
  return slice.isOther ? OTHER_COLOR : SERIES_COLORS[index % SERIES_COLORS.length];
}

export function ValueBarChart({ slices, height = 260 }: { slices: readonly ValueSlice[]; height?: number }) {
  const data = toData(slices);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
          <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
            interval={0}
          />
          <YAxis
            tick={AXIS_TICK}
            tickFormatter={(value: number) => formatNaira(Number(value))}
            tickLine={false}
            axisLine={false}
            width={76}
          />
          <Tooltip
            cursor={{ fill: "#F7F8FA" }}
            formatter={(value, name): [string, string] => [
              formatNaira(Number(value ?? 0)),
              name === "valueKobo" ? "Value" : String(name),
            ]}
          />
          <Bar dataKey="valueKobo" name="Value" isAnimationActive={false}>
            {data.map((row, index) => (
              <Cell key={row.label} fill={colorFor(row, index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ValuePieChart({ slices, height = 260 }: { slices: readonly ValueSlice[]; height?: number }) {
  const data = toData(slices);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
          <Pie
            data={data}
            dataKey="valueKobo"
            nameKey="label"
            innerRadius={54}
            outerRadius={84}
            paddingAngle={1}
            isAnimationActive={false}
          >
            {data.map((row, index) => (
              <Cell key={row.label} fill={colorFor(row, index)} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name): [string, string] => [
              formatNaira(Number(value ?? 0)),
              String(name),
            ]}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
