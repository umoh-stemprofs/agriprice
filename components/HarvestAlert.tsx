import { SourceBadge } from "@/components/SourceBadge";
import { cropLabel } from "@/lib/market/catalog";
import type { HarvestAlert as HarvestAlertData } from "@/lib/weather/alerts";
import type { WeatherBadge } from "@/lib/weather/types";

/**
 * Harvest alert (docs/01-agriprice.md, rule 9). Shown next to the sell/hold
 * badges but never changes them: rain is a harvest warning, not a price signal.
 */
export function HarvestAlert({ alert, badge }: { alert: HarvestAlertData; badge: WeatherBadge }) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-start justify-between gap-3 rounded-card border border-warning bg-warning-bg p-4"
    >
      <div className="flex items-start gap-3">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-warning"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v10M8 9l4 4 4-4" />
          <path d="M5 16a3 3 0 0 0 3 3h8a3 3 0 0 0 0-6 5 5 0 0 0-9.6-1.4A3.5 3.5 0 0 0 5 16Z" />
        </svg>
        <div>
          <p className="font-medium text-warning">{alert.message}</p>
          <p className="text-muted">
            {alert.rainMm} mm rain expected in the next {alert.days} days for{" "}
            {alert.crops.map(cropLabel).join(" and ")}.
          </p>
        </div>
      </div>
      <SourceBadge kind={badge} />
    </div>
  );
}
