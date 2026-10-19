import Link from "next/link";
import { HarvestAlert } from "@/components/HarvestAlert";
import { WeatherCard } from "@/components/WeatherCard";
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
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Weather</h1>
          <p className="text-muted">
            {farm.name} · {farm.lat.toFixed(4)}, {farm.lon.toFixed(4)}
          </p>
        </div>
        <Link href="/settings" className="btn-secondary">
          Change location
        </Link>
      </header>

      {alert && weather.ok && <HarvestAlert alert={alert} badge={weather.badge} />}

      <WeatherCard weather={weather} />

      <section aria-labelledby="farm-tip-title" className="card">
        <h2 id="farm-tip-title" className="text-xl font-semibold">
          Farm tip
        </h2>
        <p className="mt-2 text-muted">
          Rain and heat change what the harvest is worth. Cover or harvest early when heavy rain is
          coming; it is a harvest warning, not a reason to change the sell-or-hold badge.
        </p>
      </section>
    </div>
  );
}
