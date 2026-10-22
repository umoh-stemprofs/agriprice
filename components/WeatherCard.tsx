import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icons";
import { Tile } from "@/components/ui/primitives";
import { formatDayShort } from "@/lib/market/dates";
import type { DailyWeather, WeatherResult } from "@/lib/weather/types";

/**
 * Weather card, rebuilt to the weather_soil_simple screen:
 *   1. a green advice strip (what to do about watering today)
 *   2. one oversized temperature with three fact chips beside it
 *   3. forecast cards, one per day, each ending in a field-work verdict
 *
 * No source badge: this data comes from the live weather provider, so a
 * "Live" chip on the panel would only add noise.
 */

/** Icon for a forecast day, from its rain chance and cloud cover. */
function dayIcon(day: DailyWeather): IconName {
  if (day.rainChancePct >= 60 || day.rainMm >= 5) return "rain";
  if (day.rainChancePct >= 30) return "cloud";
  return "sun";
}

/** One sentence about the day, in the design's plain voice. */
function dayLine(day: DailyWeather): string {
  if (day.rainMm >= 5 || day.rainChancePct >= 60) {
    return `Soaking rain expected — about ${Math.round(day.rainMm)} mm.`;
  }
  if (day.rainChancePct >= 30) {
    return `Some clouds, a ${day.rainChancePct}% chance of a shower.`;
  }
  return "Dry all day with bright sunshine.";
}

/** The field-work verdict the design puts at the foot of each card. */
function dayVerdict(day: DailyWeather): { good: boolean; text: string } {
  if (day.rainMm >= 5 || day.rainChancePct >= 60) {
    return { good: false, text: "Skip watering — rain is coming" };
  }
  if (day.maxC >= 36) {
    return { good: false, text: "Hot — water early or late" };
  }
  return { good: true, text: "Good field work day" };
}

export function WeatherCard({
  weather,
  showForecast = true,
  variant = "wide",
}: {
  weather: WeatherResult;
  showForecast?: boolean;
  /** "wide" fills a page; "narrow" sits in a dashboard column. */
  variant?: "wide" | "narrow";
}) {
  if (!weather.ok) {
    return (
      <section aria-labelledby="weather-title" className="panel">
        <h2 id="weather-title" className="text-headline-lg">
          Weather
        </h2>
        <div className="mt-4 rounded-panel border border-loss-line bg-loss-bg p-4">
          <p className="font-medium text-loss-text">Weather is unavailable</p>
          <p className="mt-1 text-ink-muted">{weather.error}</p>
          <Link href="/weather" className="btn-secondary mt-3">
            Retry
          </Link>
        </div>
      </section>
    );
  }

  const { data } = weather;
  const today = data.daily[0];
  const tomorrow = data.daily[1];
  const temp = Math.round(data.current.tempC);
  const wet = today ? today.rainChancePct >= 60 || today.rainMm >= 5 : false;
  const dry = today ? today.rainChancePct <= 25 && today.rainMm < 1 : false;

  const adviceTitle = wet
    ? `Rain today (${Math.round(today?.rainMm ?? 0)} mm). Best to wait on watering.`
    : dry
      ? "Soil is drying out. Water while it is cool."
      : "Conditions are fair. Keep to your usual schedule.";
  const adviceBody = wet
    ? "Save your pump power. The rain will give your crops what they need."
    : dry
      ? "No rain in the next day, so your crops depend on the pump."
      : "Nothing extreme in the forecast today.";

  return (
    <section aria-labelledby="weather-title" className="space-y-6">
      {/* 1. advice strip */}
      <div className="panel-lg border-leaf-300 bg-gradient-to-r from-leaf-50 via-leaf-50 to-leaf-100">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-tile bg-leaf text-white md:h-20 md:w-20">
              <Icon name={wet ? "rain" : dry ? "sun" : "cloud"} className="h-9 w-9 md:h-10 w-10" />
            </span>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="chip border-leaf-600 bg-leaf-600 font-bold uppercase tracking-wider text-white">
                  What to do today
                </span>
                <span className="text-[12px] font-semibold text-brand">
                  {dry ? "Dry fields" : wet ? "Rain expected" : "Steady conditions"}
                </span>
              </div>
              <h2 id="weather-title" className="display text-headline-lg leading-tight text-brand-forest">
                {adviceTitle}
              </h2>
              <p className="mt-1 text-[14px] font-medium text-leaf-ink">{adviceBody}</p>
            </div>
          </div>
          <Link href="/alerts" className="btn-primary shrink-0 self-start md:self-auto">
            <Icon name="check" className="h-4 w-4" />
            Got it, thanks!
          </Link>
        </div>
      </div>

      {/* 2. oversized temperature + fact chips */}
      <div className="panel flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-6">
          <Tile tint="warn" size="lg">
            <Icon name="sun" className="h-12 w-12" />
          </Tile>
          <div>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="display tabular text-readout-lg text-ink">{temp}°C</span>
              <span className="rounded-input bg-warn-bg px-3 py-1 text-headline-md font-bold text-warn-text">
                {data.current.text}
              </span>
            </div>
            <p className="mt-1 text-[15px] font-medium text-ink-muted">
              {today
                ? `${Math.round(today.maxC)}° high · ${Math.round(today.minC)}° low · ${dayLine(today)}`
                : data.current.text}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-panel border border-line bg-surface-dim px-4 py-3">
            <Icon name="water" className="h-6 w-6 text-sky" />
            <div>
              <p className="micro">Precipitation</p>
              <p className="text-[15px] font-bold text-ink tabular">
                Rain chance: {today ? today.rainChancePct : 0}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-panel border border-line bg-surface-dim px-4 py-3">
            <Icon name="wind" className="h-6 w-6 text-ink-muted" />
            <div>
              <p className="micro">Breeze</p>
              <p className="text-[15px] font-bold text-ink tabular">
                Wind: {Math.round(data.current.windKmh)} km/h
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-panel border border-line bg-surface-dim px-4 py-3">
            <Icon name="thermometer" className="h-6 w-6 text-optimal" />
            <div>
              <p className="micro">Humidity</p>
              <p className="text-[15px] font-bold text-ink tabular">
                Air: {data.current.humidity}% moisture
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. forecast cards */}
      {showForecast && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-headline-lg text-ink">
              {variant === "wide" ? "Simple forecast" : "Next days"}
            </h3>
            <span className="text-[13px] font-medium text-ink-muted">Plan your field activities</span>
          </div>
          <ul className={`grid gap-5 ${variant === "wide" ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1"}`}>
            {data.daily.map((day, index) => {
              const verdict = dayVerdict(day);
              const icon = dayIcon(day);
              return (
                <li
                  key={day.date}
                  className={`flex flex-col justify-between gap-5 rounded-panel border bg-surface p-5 ${
                    index === 0 ? "border-leaf-200" : "border-line"
                  }`}
                >
                  <div>
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={`text-label-sm uppercase tracking-wider ${
                            index === 0 ? "font-extrabold text-brand" : "font-bold text-ink-muted"
                          }`}
                        >
                          {index === 0 ? "Today" : index === 1 ? "Tomorrow" : `In ${index} days`}
                        </span>
                        <p className="text-headline-md text-ink">
                          {formatDayShort(day.date)}
                        </p>
                      </div>
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-panel ${
                          icon === "rain"
                            ? "bg-sky-100 text-sky-deep"
                            : icon === "cloud"
                              ? "bg-surface-dim text-ink-muted"
                              : "bg-warn-bg text-warn-text"
                        }`}
                      >
                        <Icon name={icon} className="h-6 w-6" />
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="display text-readout-sm tabular text-ink">
                        {Math.round(day.maxC)}°C
                      </span>
                      <span className="text-[14px] font-medium text-ink-muted tabular">
                        / {Math.round(day.minC)}°C night
                      </span>
                    </div>
                    <p className="mt-1 text-[14px] font-semibold text-ink">
                      {day.rainMm >= 5 ? `Rain is coming! (${Math.round(day.rainMm)} mm)` : dayLine(day)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-full items-center justify-center gap-1.5 rounded-panel px-3.5 py-2 text-[13px] font-bold ${
                      verdict.good ? "bg-leaf-100 text-brand" : "bg-warn-bg text-warn-text"
                    }`}
                  >
                    <Icon name={verdict.good ? "check" : "water"} className="h-4 w-4" />
                    {verdict.text}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
