import { formatInTimeZone } from "date-fns-tz";
import { APP_TZ } from "@/lib/config";

/**
 * Calendar-day helpers. The app only ever deals with the date as it is in
 * APP_TZ (Africa/Lagos), never the server's clock zone.
 * Day arithmetic runs on UTC noon so daylight-saving shifts cannot skip a day.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's calendar date in APP_TZ, as "YYYY-MM-DD". */
export function todayInTz(now: Date = new Date(), timeZone: string = APP_TZ): string {
  return formatInTimeZone(now, timeZone, "yyyy-MM-dd");
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateOnly(value: string): boolean {
  return DATE_RE.test(value);
}

/** "YYYY-MM-DD" -> a Date at UTC noon of that day. */
export function toUtcNoon(dateOnly: string): Date {
  if (!isDateOnly(dateOnly)) {
    throw new Error(`Expected a date as YYYY-MM-DD, received "${dateOnly}".`);
  }
  const [year, month, day] = dateOnly.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Not a real date: "${dateOnly}".`);
  }
  return date;
}

function fromUtcNoon(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** date + n days, as "YYYY-MM-DD". */
export function addDays(dateOnly: string, n: number): string {
  return fromUtcNoon(new Date(toUtcNoon(dateOnly).getTime() + n * DAY_MS));
}

/** Whole days from a to b: positive when b is later. */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtcNoon(b).getTime() - toUtcNoon(a).getTime()) / DAY_MS);
}

/** The last n days ending on (and including) endDate, oldest first. */
export function lastNDays(endDate: string, n: number): string[] {
  const count = Math.max(0, Math.trunc(n));
  return Array.from({ length: count }, (_, i) => addDays(endDate, -(count - 1 - i)));
}

/** Screen form: "Mon 20 Oct" (docs/design.md §6). */
export function formatDayShort(dateOnly: string, timeZone: string = APP_TZ): string {
  return formatInTimeZone(toUtcNoon(dateOnly), timeZone, "EEE d MMM");
}

/** Screen form: "20 Oct 2026". */
export function formatDayLong(dateOnly: string, timeZone: string = APP_TZ): string {
  return formatInTimeZone(toUtcNoon(dateOnly), timeZone, "d MMM yyyy");
}

/** "3 h old" / "12 min old" for the data-source badge (docs/design.md §2). */
export function ageLabel(from: Date, now: Date = new Date()): string {
  const minutes = Math.max(0, Math.round((now.getTime() - from.getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min old`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h old`;
  return `${Math.round(hours / 24)} days old`;
}
