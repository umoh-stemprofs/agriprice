import Link from "next/link";
import { SourceBadge } from "@/components/SourceBadge";
import { ageLabel, formatDayShort } from "@/lib/market/dates";
import type { WeatherResult } from "@/lib/weather/types";

/**
 * Weather card used on the dashboard and the weather page
 * (docs/design.md §2: every data card carries its source badge).
 */
export function WeatherCard({
  weather,
  showForecast = true,
  variant = "wide",
}: {
  weather: WeatherResult;
  showForecast?: boolean;
  /** "wide" fills a page (5 columns on desktop); "narrow" sits in a column. */
  variant?: "wide" | "narrow";
}) {
  if (!weather.ok) {
    return (
      <section aria-labelledby="weather-title" className="card">
        <h2 id="weather-title" className="text-xl font-semibold">
          Weather
        </h2>
        <div className="mt-4 rounded-card border border-danger bg-danger-bg p-4">
          <p className="font-medium text-danger">Weather is unavailable</p>
          <p className="mt-1 text-muted">{weather.error}</p>
          <Link href="/weather" className="btn-secondary mt-3">
            Retry
          </Link>
        </div>
      </section>
    );
  }

  const { data, badge } = weather;

  return (
    <section aria-labelledby="weather-title" className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="weather-title" className="text-xl font-semibold">
            Weather
          </h2>
          <p className="text-muted">
            {data.daily[0]?.date ? formatDayShort(data.daily[0].date) : "Today"} ·{" "}
            {data.daily.length}-day forecast
          </p>
        </div>
        <SourceBadge kind={badge} age={ageLabel(new Date(data.fetchedAt))} />
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        <p className="text-4xl font-bold tabular-nums">{Math.round(data.current.tempC)}°C</p>
        <p className="text-muted">
          {data.current.text} · humidity {data.current.humidity}% · wind{" "}
          {Math.round(data.current.windKmh)} km/h
        </p>
      </div>

      {showForecast && (
        <ul
          className={`mt-4 grid gap-3 ${
            variant === "wide" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-2"
          }`}
        >
          {data.daily.map((day) => (
            <li key={day.date} className="rounded-card border border-border p-3 text-center">
              <p className="text-sm font-medium text-muted">{formatDayShort(day.date)}</p>
              <p className="mt-1 font-semibold tabular-nums">
                {Math.round(day.maxC)}° / {Math.round(day.minC)}°
              </p>
              <p className="text-sm text-muted tabular-nums">{day.rainMm} mm</p>
              <p className="text-sm text-muted tabular-nums">{day.rainChancePct}% rain</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
