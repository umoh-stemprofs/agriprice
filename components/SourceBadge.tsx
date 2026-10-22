/**
 * Data-source badge (docs/design.md §2, required by the Agriculture rules:
 * "state which data is live and which is simulated").
 * Always colour + icon + word, never colour alone. Top-right of every card
 * that shows prices or weather.
 *
 * Colours follow the AgriPulse telemetry chip spec (agripulse_precision):
 * a pale fill, a 1px border in the same hue and label-sm type at 4px radius.
 */

export type BadgeKind = "live" | "saved" | "simulated";

const STYLES: Record<BadgeKind, { className: string; label: (age?: string) => string }> = {
  live: {
    className: "border-optimal-line bg-optimal-bg text-optimal-text",
    label: (age) => (age ? `Live · updated ${age}` : "Live"),
  },
  saved: {
    className: "border-warn-line bg-warn-bg text-warn-text",
    label: (age) => (age ? `Saved data · ${age}` : "Saved data"),
  },
  simulated: {
    className: "border-line-strong bg-surface-lower text-ink-muted",
    label: () => "Simulated",
  },
};

function Icon({ kind }: { kind: BadgeKind }) {
  if (kind === "live") {
    // solid dot
    return (
      <svg viewBox="0 0 8 8" aria-hidden="true" className="h-2 w-2 fill-current">
        <circle cx="4" cy="4" r="4" />
      </svg>
    );
  }
  if (kind === "saved") {
    // clock
    return (
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <circle cx="8" cy="8" r="6" />
        <path d="M8 4.5V8l2.5 1.5" strokeLinecap="round" />
      </svg>
    );
  }
  // flask
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        d="M6.5 2h3M7 2v4L3.8 11.4A1.5 1.5 0 0 0 5.1 14h5.8a1.5 1.5 0 0 0 1.3-2.6L9 6V2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5.2 10h5.6" strokeLinecap="round" />
    </svg>
  );
}

export function SourceBadge({ kind, age }: { kind: BadgeKind; age?: string }) {
  const style = STYLES[kind];
  return (
    <span className={`pill ${style.className}`}>
      <Icon kind={kind} />
      {style.label(age)}
    </span>
  );
}
