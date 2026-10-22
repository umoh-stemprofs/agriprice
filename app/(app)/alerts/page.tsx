import Link from "next/link";
import { DemoHarvestSwitch } from "@/components/DemoHarvestSwitch";
import { SourceBadge, type BadgeKind } from "@/components/SourceBadge";
import { Icon, type IconName } from "@/components/ui/icons";
import { buildTodayAlerts, type AlertTone, type TodayAlert } from "@/lib/alerts/today";
import { requireFarm, requireUser } from "@/lib/auth/guard";
import { demoModeEnabled, MARKET } from "@/lib/config";
import { db } from "@/lib/db";
import { todayInTz } from "@/lib/market/dates";
import { marketProvider } from "@/lib/market/provider";
import { sellWindow } from "@/lib/sellWindow";
import { harvestAlert } from "@/lib/weather/alerts";
import { getWeather } from "@/lib/weather/provider";

export const dynamic = "force-dynamic";
export const metadata = { title: "Alerts · AgriPrice" };

/**
 * Alerts (docs/01-agriprice.md, page 8): everything today that is worth the
 * farmer's attention, in one list — the harvest warning, the sell/hold answer
 * per crop in stock, missing costs and a weather outage. Every alert is one
 * icon, one word, one sentence and one button (docs/design.md §2).
 */

const TONE_CLASS: Record<AlertTone, string> = {
  success: "text-optimal-text",
  warning: "text-warn-text",
  danger: "text-loss-text",
  info: "text-info-text",
  muted: "text-ink-muted",
};

const TONE_TILE: Record<AlertTone, string> = {
  success: "bg-leaf-100 text-brand",
  warning: "bg-warn-bg text-warn-text",
  danger: "bg-loss-bg text-loss-text",
  info: "bg-info-bg text-info-text",
  muted: "bg-surface-dim text-ink-muted",
};

const KIND_ICON: Record<TodayAlert["kind"], IconName> = {
  harvest: "water",
  weather: "cloud",
  costs: "costs",
  decision: "market",
};

/**
 * Only the simulated price decisions carry a badge. The weather behind harvest
 * and weather alerts is real provider data, so it gets no "Live" chip, and
 * "Costs not set" is about the farmer's own settings.
 */
function badgeFor(alert: TodayAlert): BadgeKind | null {
  if (alert.kind === "decision") return "simulated";
  return null;
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

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="chip border-leaf-300 bg-leaf-100 font-bold uppercase tracking-wide text-brand">
            Today
          </span>
          <h1 className="display mt-2 text-display-md text-ink">What needs you today</h1>
          <p className="mt-1 text-[17px] text-ink-muted">
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
        <div className="panel-lg text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-tile bg-leaf-100 text-brand">
            <Icon name="checkCircle" className="h-8 w-8" />
          </span>
          <p className="display mt-4 text-headline-md text-ink">No alerts today.</p>
          <p className="mt-1 text-ink-muted">
            New alerts appear here when prices, costs or the weather are worth knowing about.
          </p>
          <Link href="/dashboard" className="btn-primary mt-5">
            Open dashboard
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => {
            const badge = badgeFor(alert);
            return (
              <li
                key={alert.id}
                className="flex flex-wrap items-start justify-between gap-4 rounded-panel border border-line bg-surface p-5"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-tile ${TONE_TILE[alert.tone]}`}
                    aria-hidden="true"
                  >
                    <Icon name={KIND_ICON[alert.kind]} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`font-semibold ${TONE_CLASS[alert.tone]}`}>{alert.word}</p>
                      {alert.demo && (
                        <span className="chip border-info-line bg-info-bg text-info-text">
                          Demo preview
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[15px]">{alert.sentence}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {badge && <SourceBadge kind={badge} />}
                  <Link href={alert.href} className="btn-secondary px-4 text-sm">
                    {alert.action}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {demoModeEnabled() && <DemoHarvestSwitch />}

      <p className="text-[13px] text-ink-muted">
        Prices behind these alerts come from the simulated feed until a reviewed live source is
        connected. Sample decision rules — an expert must review them before any real use.
      </p>
    </div>
  );
}
