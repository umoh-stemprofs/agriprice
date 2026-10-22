import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icons";

/**
 * The reusable pieces the design screens repeat, rebuilt as components so
 * every page uses the same geometry (stitch_agropulse_analytics_dashboard).
 *
 * Each one mirrors a block that appears in the generated HTML of the four
 * screens: the tinted tile, the telemetry chip, the section heading row, the
 * oversized value, the capacity gauge and the stat card.
 */

/* ------------------------------------------------------------------ tiles */

const TILE_TINTS = {
  amber: "bg-amber-100 text-amber-800",
  leaf: "bg-leaf-100 text-leaf-800",
  sky: "bg-sky-100 text-sky-700",
  warn: "bg-warn-bg text-warn-text",
  brand: "bg-brand-tint text-brand",
} as const;

export type TileTint = keyof typeof TILE_TINTS;

export function Tile({
  children,
  tint = "leaf",
  size = "md",
}: {
  children: ReactNode;
  tint?: TileTint;
  /** md = 56px (card headers), lg = 80px (hero rows). */
  size?: "sm" | "md" | "lg";
}) {
  const box =
    size === "lg"
      ? "h-20 w-20 rounded-tile text-4xl"
      : size === "sm"
        ? "h-10 w-10 rounded-card text-xl"
        : "h-14 w-14 rounded-tile text-3xl";
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${box} ${TILE_TINTS[tint]}`}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ chips */

/** Tinted chip, e.g. the "ALL SYSTEMS GOOD" / "Safe & Dry" tags. */
export function TintChip({
  children,
  tone = "optimal",
  icon,
  className = "",
}: {
  children: ReactNode;
  tone?: "optimal" | "warn" | "loss" | "info" | "neutral";
  icon?: IconName;
  className?: string;
}) {
  const tones = {
    optimal: "border-optimal-line bg-optimal-bg text-optimal-text",
    warn: "border-warn-line bg-warn-bg text-warn-text",
    loss: "border-loss-line bg-loss-bg text-loss-text",
    info: "border-info-line bg-info-bg text-info-text",
    neutral: "border-line bg-surface-dim text-ink-muted",
  } as const;

  return (
    <span className={`chip font-semibold ${tones[tone]} ${className}`}>
      {icon && <Icon name={icon} className="h-4 w-4" />}
      {children}
    </span>
  );
}

/** Live telemetry chip: a pulsing dot plus a short label. */
export function LiveChip({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`chip border-optimal-line bg-optimal-bg font-semibold text-optimal-text ${className}`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-optimal opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-optimal" />
      </span>
      {children}
    </span>
  );
}

/* ---------------------------------------------------------- section heads */

/** Section heading row: title left, a supporting note right. */
export function SectionHead({
  title,
  note,
  id,
}: {
  title: string;
  note?: ReactNode;
  id?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 id={id} className="text-headline-lg text-ink">
        {title}
      </h2>
      {note && <p className="text-[13px] font-medium text-ink-muted">{note}</p>}
    </div>
  );
}

/** Micro-label + optional right-hand value, used above big numbers. */
export function ReadoutLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="micro">{children}</span>
      {right}
    </div>
  );
}

/* ---------------------------------------------------------------- gauges */

/** 6px segmented track (DESIGN.md "Soil Moisture / Canopy Bar Gauges"). */
export function Gauge({
  pct,
  tone = "optimal",
}: {
  pct: number;
  tone?: "optimal" | "warn" | "loss";
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const fill = tone === "warn" ? "bg-warn" : tone === "loss" ? "bg-loss" : "bg-optimal";
  return (
    <div
      className="gauge"
      role="meter"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

/** The chunky capacity track the storage screen uses. */
export function CapacityGauge({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div
      className="gauge-lg"
      role="meter"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${clamped}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------- stat cards */

/**
 * The "big glanceable card" from the overview screen: micro-label and tinted
 * icon on top, an oversized numeral, then a footnote chip under a hairline.
 */
export function StatCard({
  label,
  value,
  unit,
  hint,
  tile,
  footer,
  accent = false,
  children,
}: {
  label: string;
  value: string;
  /** Small unit beside the numeral, e.g. "Acres". */
  unit?: string;
  hint?: string;
  tile?: ReactNode;
  footer?: ReactNode;
  /** The design highlights one card per row with a green tint. */
  accent?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col justify-between rounded-hero border p-6 ${
        accent
          ? "border-leaf-300 bg-gradient-to-b from-leaf-50 to-surface"
          : "border-line bg-surface transition-colors hover:border-brand"
      }`}
    >
      <div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <span className={`micro ${accent ? "text-brand-hover" : ""}`}>{label}</span>
          {tile}
        </div>
        <p className={`display min-w-0 break-words text-metric tabular sm:text-readout ${accent ? "text-brand" : "text-ink"}`}>
          {value}
          {unit && (
            <span className={`ml-1.5 text-headline-md ${accent ? "text-brand-hover" : "text-ink-muted"}`}>
              {unit}
            </span>
          )}
        </p>
        {hint && <p className="mt-2 text-[13px] font-medium text-ink-muted">{hint}</p>}
        {children}
      </div>

      {footer && (
        <div className={`mt-4 border-t pt-4 ${accent ? "border-leaf-100" : "border-line-soft"}`}>
          {footer}
        </div>
      )}
    </div>
  );
}
