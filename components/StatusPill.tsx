import type { SellStatus } from "@/lib/sellWindow";

/**
 * Status chip (docs/design.md §1: status is never colour alone — icon + word).
 * - Sell now: green tick, optimal state
 * - Hold: amber up arrow, warning state
 * - Need data: neutral, and the chip says the whole sentence the rules require.
 *
 * Colours follow the AgriPulse telemetry chip spec (agripulse_precision):
 * pale fill, 1px border in the same hue, label-sm type at 4px radius.
 */

const STYLES: Record<SellStatus, string> = {
  SELL_NOW: "border-optimal-line bg-optimal-bg text-optimal-text",
  HOLD: "border-warn-line bg-warn-bg text-warn-text",
  NEED_DATA: "border-line-strong bg-surface-lower text-ink-muted",
};

function Icon({ status, className = "h-4 w-4" }: { status: SellStatus; className?: string }) {
  if (status === "SELL_NOW") {
    return (
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "HOLD") {
    return (
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M8 13V3M4 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
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
        size === "lg" ? "px-3 py-1 text-[13px]" : ""
      } whitespace-normal text-left`}
    >
      <Icon status={status} className={`shrink-0 ${size === "lg" ? "h-5 w-5" : "h-4 w-4"}`} />
      {LABELS[status]}
    </span>
  );
}
