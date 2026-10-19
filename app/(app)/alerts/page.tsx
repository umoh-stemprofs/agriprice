import Link from "next/link";
import { DemoHarvestSwitch } from "@/components/DemoHarvestSwitch";
import { SourceBadge, type BadgeKind } from "@/components/SourceBadge";
import { buildTodayAlerts, type AlertTone, type TodayAlert } from "@/lib/alerts/today";
import { requireFarm, requireUser } from "@/lib/auth/guard";
import { demoModeEnabled, MARKET } from "@/lib/config";
import { db } from "@/lib/db";
import { todayInTz } from "@/lib/market/dates";
import { marketProvider } from "@/lib/market/provider";
import { sellWindow } from "@/lib/sellWindow";
import { harvestAlert } from "@/lib/weather/alerts";
import { getWeather } from "@/lib/weather/provider";
import type { WeatherBadge } from "@/lib/weather/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Alerts · AgriPrice" };

/**
 * Alerts (docs/01-agriprice.md, page 8): everything today that is worth the
 * farmer's attention, in one list — the harvest warning, the sell/hold answer
 * per crop in stock, missing costs and a weather outage. Every alert is one
 * icon, one word, one sentence and one button (docs/design.md §2).
 */

const TONE_CLASS: Record<AlertTone, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
  muted: "text-muted",
};

function AlertIcon({ kind, className = "h-5 w-5" }: { kind: TodayAlert["kind"]; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;

  if (kind === "harvest") {
    return (
      <svg {...common}>
        <path d="M12 3v10M8 9l4 4 4-4" />
        <path d="M5 16a3 3 0 0 0 3 3h8a3 3 0 0 0 0-6 5 5 0 0 0-9.6-1.4A3.5 3.5 0 0 0 5 16Z" />
      </svg>
    );
  }
  if (kind === "weather") {
    return (
      <svg {...common}>
        <path d="M7 17.5h10a4 4 0 0 0 .4-8 6 6 0 0 0-11.6 1.2A3.4 3.4 0 0 0 7 17.5Z" />
        <path d="M3 3l18 18" />
      </svg>
    );
  }
  if (kind === "costs") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5v9M9.5 9.7c.6-.9 1.5-1.2 2.6-1.2 1.4 0 2.5.8 2.5 2s-1.1 1.9-2.5 1.9-2.6.7-2.6 1.9 1.1 2 2.6 2c1.1 0 2-.4 2.6-1.2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M3.5 17.5 9 11l4 3.5 7.5-8" />
      <path d="M15.5 6.5h5v5" />
    </svg>
  );
}

/** Weather alerts carry the weather badge; price decisions say Simulated. */
function badgeFor(alert: TodayAlert, weatherBadge: WeatherBadge | null): BadgeKind | null {
  if (alert.kind === "decision") return "simulated";
  if (alert.kind === "harvest" || alert.kind === "weather") return weatherBadge;
  return null; // "Costs not set" is about the farmer's own settings.
}

export default async function AlertsPage() {
  const user = await requireUser();
  const farm = await requireFarm(user.id);
  const today = todayInTz();

  const [inventory, costs, weather] = await Promise.all([
    db.inventoryItem
      .findMany({ where: { farmId: farm.id }, orderBy: { crop: "asc" } })
      .catch(() => []),
    db.costSetting.findMany({ where: { farmId: farm.id } }).catch(() => []),
    getWeather(farm.lat, farm.lon, { farmId: farm.id }),
  ]);

  const provider = marketProvider();
  const histories = await Promise.all(
    inventory.map((item) =>
      provider.history(item.crop, today, MARKET.trendDays).catch(() => null),
    ),
  );

  const costByCrop = new Map(costs.map((cost) => [cost.crop, cost] as const));
  const crops = inventory.map((item, index) => {
    const prices = histories[index]?.ticks.map((tick) => tick.priceKobo) ?? [];
    const result = sellWindow(prices, item.qtyKg, costByCrop.get(item.crop) ?? null);
    return {
      crop: item.crop,
      status: result.status,
      message: result.message,
      costsNotSet: result.costsNotSet,
    };
  });

  const harvest = weather.ok
    ? harvestAlert(
        weather.data.daily,
        inventory.map((item) => item.crop),
      )
    : null;

  const alerts = buildTodayAlerts({
    crops,
    harvest,
    weatherError: weather.ok ? null : weather.error,
  });
  const weatherBadge = weather.ok ? weather.badge : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Alerts</h1>
          <p className="text-muted">
            {alerts.length === 0
              ? "Nothing needs your attention today."
              : `${alerts.length} alert${alerts.length === 1 ? "" : "s"} for ${farm.name} today.`}
          </p>
        </div>
        <Link href="/dashboard" className="btn-secondary">
          Open dashboard
        </Link>
      </header>

      {alerts.length === 0 ? (
        <div className="card text-center">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="mx-auto h-8 w-8 text-success"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12.5 11 15.5 16.5 9" />
          </svg>
          <p className="mt-3 font-medium">No alerts today.</p>
          <p className="mt-1 text-muted">
            New alerts appear here when prices, costs or the weather are worth knowing about.
          </p>
          <Link href="/dashboard" className="btn-primary mt-4">
            Open dashboard
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => {
            const badge = badgeFor(alert, weatherBadge);
            return (
              <li key={alert.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={`mt-0.5 shrink-0 ${TONE_CLASS[alert.tone]}`}>
                      <AlertIcon kind={alert.kind} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`font-medium ${TONE_CLASS[alert.tone]}`}>{alert.word}</p>
                        {alert.demo && <span className="pill bg-info-bg text-info">Demo preview</span>}
                      </div>
                      <p className="mt-1">{alert.sentence}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {badge && <SourceBadge kind={badge} />}
                    <Link href={alert.href} className="btn-secondary px-3 text-sm">
                      {alert.action}
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {demoModeEnabled() && <DemoHarvestSwitch />}

      <p className="text-sm text-muted">
        Prices behind these alerts come from the simulated feed until a reviewed live source is
        connected. Sample decision rules — an expert must review them before any real use.
      </p>
    </div>
  );
}
