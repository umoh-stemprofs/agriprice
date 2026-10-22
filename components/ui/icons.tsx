/**
 * Icon set for the redesign.
 *
 * The design screens use Google Material Symbols. These are hand-drawn 24x24
 * stroke equivalents so the app ships no icon font and no network request;
 * each one is close enough in weight and silhouette to read the same at the
 * sizes the design uses (16px inside chips, 20-28px inside nav and tiles).
 */

import type { ReactNode } from "react";

export type IconName =
  | "home"
  | "market"
  | "stock"
  | "weather"
  | "alerts"
  | "costs"
  | "settings"
  | "logout"
  | "location"
  | "refresh"
  | "check"
  | "checkCircle"
  | "close"
  | "chevronRight"
  | "chevronDown"
  | "trendUp"
  | "trendDown"
  | "trendFlat"
  | "search"
  | "bell"
  | "more"
  | "leaf"
  | "grain"
  | "water"
  | "sun"
  | "cloud"
  | "rain"
  | "thermometer"
  | "wind"
  | "coins"
  | "warehouse"
  | "add"
  | "trash"
  | "info"
  | "sprout";

const PATHS: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M3.5 10.5 12 4l8.5 6.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),
  market: (
    <>
      <path d="M3.5 17.5 9 11l4 3.5 7.5-8" />
      <path d="M15.5 6.5h5v5" />
    </>
  ),
  stock: (
    <>
      <path d="M3.5 8.5 12 4l8.5 4.5L12 13 3.5 8.5Z" />
      <path d="m3.5 13 8.5 4.5L20.5 13" />
      <path d="M3.5 17.5 12 22l8.5-4.5" />
    </>
  ),
  weather: (
    <>
      <path d="M7 17.5h10a4 4 0 0 0 .4-8 6 6 0 0 0-11.6 1.2A3.4 3.4 0 0 0 7 17.5Z" />
    </>
  ),
  alerts: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  costs: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M9.5 9.7c.6-.9 1.5-1.2 2.6-1.2 1.4 0 2.5.8 2.5 2s-1.1 1.9-2.5 1.9-2.6.7-2.6 1.9 1.1 2 2.6 2c1.1 0 2-.4 2.6-1.2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 12 4.6a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l-.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 19.4 11a2 2 0 1 1 0 4Z" />
    </>
  ),
  logout: (
    <>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 8l-4 4 4 4M6 12h10" />
    </>
  ),
  location: (
    <>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14-4.5L4 9" />
      <path d="M4 5v4h4" />
      <path d="M4 13a8 8 0 0 0 14 4.5L20 15" />
      <path d="M20 19v-4h-4" />
    </>
  ),
  check: <path d="M5 12.5 10 17.5 19 7" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5 11 15.5 16.5 9" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  chevronDown: <path d="m5 9 7 7 7-7" />,
  trendUp: (
    <>
      <path d="M3.5 17.5 9 11l4 3.5 7.5-8" />
      <path d="M15.5 6.5h5v5" />
    </>
  ),
  trendDown: (
    <>
      <path d="M3.5 6.5 9 13l4-3.5 7.5 8" />
      <path d="M15.5 17.5h5v-5" />
    </>
  ),
  trendFlat: <path d="M4 12h16" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  more: (
    <>
      <circle cx="12" cy="5" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="12" cy="19" r="1.4" />
    </>
  ),
  leaf: (
    <>
      <path d="M4 20c0-9 6-15 16-15 0 10-6 15-16 15Z" />
      <path d="M9 15c1.5-3 4-5.5 7-7" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 21v-7" />
      <path d="M12 14c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6Z" />
      <path d="M12 14c0-4 2.5-7 6-7 0 4-2.5 7-6 7Z" />
    </>
  ),
  grain: (
    <>
      <path d="M12 21V9" />
      <path d="M12 9c0-2 1.5-3.5 3.5-3.5C15.5 7.5 14 9 12 9Z" />
      <path d="M12 9c0-2-1.5-3.5-3.5-3.5C8.5 7.5 10 9 12 9Z" />
      <path d="M12 14c0-2 1.5-3.5 3.5-3.5C15.5 12.5 14 14 12 14Z" />
      <path d="M12 14c0-2-1.5-3.5-3.5-3.5C8.5 12.5 10 14 12 14Z" />
      <path d="M12 19c0-2 1.5-3.5 3.5-3.5C15.5 17.5 14 19 12 19Z" />
      <path d="M12 19c0-2-1.5-3.5-3.5-3.5C8.5 17.5 10 19 12 19Z" />
    </>
  ),
  water: <path d="M12 3.5c3.5 4.5 5.5 7.5 5.5 10a5.5 5.5 0 1 1-11 0c0-2.5 2-5.5 5.5-10Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.2 5.2l1.8 1.8M17 17l1.8 1.8M18.8 5.2 17 7M7 17l-1.8 1.8" />
    </>
  ),
  cloud: (
    <>
      <path d="M7 18h10a4 4 0 0 0 .4-8 6 6 0 0 0-11.6 1.2A3.4 3.4 0 0 0 7 18Z" />
    </>
  ),
  rain: (
    <>
      <path d="M7 15h10a4 4 0 0 0 .4-8 6 6 0 0 0-11.6 1.2A3.4 3.4 0 0 0 7 15Z" />
      <path d="M9 18v2.5M13 18v3M17 18v2.5" />
    </>
  ),
  thermometer: (
    <>
      <path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0Z" />
    </>
  ),
  wind: (
    <>
      <path d="M3 8h11a3 3 0 1 0-3-3" />
      <path d="M3 12h15a3 3 0 1 1-3 3" />
      <path d="M3 16h8a2.5 2.5 0 1 1-2.5 2.5" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="12" cy="6.5" rx="7" ry="3" />
      <path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
      <path d="M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
    </>
  ),
  warehouse: (
    <>
      <path d="M3 20V9l9-4 9 4v11" />
      <path d="M7 20v-7h10v7" />
      <path d="M7 16.5h10" />
    </>
  ),
  add: <path d="M12 5v14M5 12h14" />,
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6.5 7 7.5 20h9L17.5 7" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.6v.9" />
    </>
  ),
};

export function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </svg>
  );
}
