import Link from "next/link";
import { HarvestAlert } from "@/components/HarvestAlert";
import { WeatherCard } from "@/components/WeatherCard";
import { Icon } from "@/components/ui/icons";
import { requireFarm, requireUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { harvestAlert } from "@/lib/weather/alerts";
import { getWeather } from "@/lib/weather/provider";

export const dynamic = "force-dynamic";
export const metadata = { title: "Weather · AgriPrice" };

export default async function WeatherPage() {
  const user = await requireUser();
  const farm = await requireFarm(user.id);

  const [weather, stock] = await Promise.all([
    getWeather(farm.lat, farm.lon, { farmId: farm.id }),
    db.inventoryItem
      .findMany({ where: { farmId: farm.id }, select: { crop: true } })
      .catch(() => []),
  ]);

  const alert = weather.ok ? harvestAlert(weather.data.daily, stock.map((row) => row.crop)) : null;

  return (
    <div className="space-y-8">
      {/* Header: eyebrow + title, like the weather screen */}
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip border-leaf-300 bg-leaf-100 font-bold uppercase tracking-wide text-brand">
            Daily overview
          </span>
          <span className="text-[14px] text-ink-muted">
            {farm.name} · {farm.lat.toFixed(4)}, {farm.lon.toFixed(4)}
          </span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="display text-display-md text-ink">Weather &amp; soil check</h1>
            <p className="mt-1 text-[17px] text-ink-muted">
              Simple guide for what your crops need today.
            </p>
          </div>
          <Link href="/settings" className="btn-secondary">
            <Icon name="location" className="h-4 w-4" />
            Change location
          </Link>
        </div>
      </header>

      {alert && weather.ok && <HarvestAlert alert={alert} />}

      <WeatherCard weather={weather} />
    </div>
  );
}
