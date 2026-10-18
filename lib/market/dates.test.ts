import { describe, expect, it } from "vitest";
import { addDays, daysBetween, formatDayShort, lastNDays, todayInTz } from "./dates";

/**
 * Calendar-day helpers. All of it runs in APP_TZ (Africa/Lagos) and on UTC
 * noon, never on the server's clock zone (docs/00-global.md §2).
 */

describe("date helpers", () => {
  it("lastNDays ends on the given day, oldest first", () => {
    const days = lastNDays("2026-10-18", 14);
    expect(days).toHaveLength(14);
    expect(days[0]).toBe("2026-10-05");
    expect(days[days.length - 1]).toBe("2026-10-18");
    expect([...days].sort()).toEqual(days); // ascending
    // every date is in the past or today — never in the future
    expect(days.every((date) => daysBetween(date, "2026-10-18") >= 0)).toBe(true);
  });

  it("addDays crosses month and year boundaries", () => {
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("daysBetween counts whole days", () => {
    expect(daysBetween("2026-10-01", "2026-10-18")).toBe(17);
    expect(daysBetween("2026-10-18", "2026-10-01")).toBe(-17);
    expect(daysBetween("2026-10-18", "2026-10-18")).toBe(0);
  });

  it("todayInTz is a real YYYY-MM-DD date in APP_TZ", () => {
    expect(todayInTz(new Date("2026-10-18T12:00:00Z"))).toBe("2026-10-18");
    expect(todayInTz(new Date("2026-10-18T12:00:00Z"), "UTC")).toBe("2026-10-18");
    // 23:30 UTC is already the next day in Lagos (UTC+1)
    expect(todayInTz(new Date("2026-10-18T23:30:00Z"), "Africa/Lagos")).toBe("2026-10-19");
    expect(todayInTz(new Date("2026-10-18T23:30:00Z"), "UTC")).toBe("2026-10-18");
  });

  it("formats a day the way the design wants it", () => {
    expect(formatDayShort("2026-10-18")).toBe("Sun 18 Oct");
  });
});
