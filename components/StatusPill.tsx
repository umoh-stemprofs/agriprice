import type { SellStatus } from "@/lib/sellWindow";

/**
 * Status pill (docs/design.md §1: status is never colour alone — icon + word).
 * - Sell now: green tick
 * - Hold: amber up arrow
 * - Need data: grey, and the pill says the whole sentence the rules require.
 */

const STYLES: Record<SellStatus, string> = {
  SELL_NOW: "bg-success-bg text-success",
  HOLD: "bg-warning-bg text-warning",
  NEED_DATA: "bg-bg text-muted ring-1 ring-inset ring-border",
};

function Icon({ status, className = "h-4 w-4" }: { status: SellStatus; className?: string }) {
  if (status === "SELL_NOW") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "HOLD") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 13V3M4 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7.5V11M8 5.2v.2" strokeLinecap="round" />
    </svg>
  );
}

const LABELS: Record<SellStatus, string> = {
  SELL_NOW: "Sell now",
  HOLD: "Hold",
  NEED_DATA: "Not enough price history yet.",
};

export function StatusPill({ status, size = "sm" }: { status: SellStatus; size?: "sm" | "lg" }) {
  return (
    <span
      className={`pill ${STYLES[status]} ${
        size === "lg" ? "px-3 py-1.5 text-base" : ""
      }`}
    >
      <Icon status={status} className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
      {LABELS[status]}
    </span>
  );
}
