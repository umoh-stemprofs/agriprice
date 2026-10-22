"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";

/**
 * Dashboard shell, rebuilt to the Stitch overview screen's sidebar and used
 * the same way on every page (stitch_agropulse_analytics_dashboard).
 *
 * Sidebar anatomy, straight from that screen:
 * - brand header on a faint fill with a rounded green tile, hairline divider
 * - an "active farm" telemetry chip with a live ping dot
 * - nav rows: solid green + white when active, otherwise ink on white with a
 *   faint hover fill; the icon is muted when the row is not active
 * - a footer block on the same faint fill carrying the user and the logout
 *
 * Breakpoints are unchanged from docs/design.md §3:
 * - 1024 px and up: the sidebar.
 * - 640–1023 px: a sticky bar with the same links across the top.
 * - under 640 px: a sticky bar plus a bottom nav of four daily destinations;
 *   Alerts and Settings move to the top bar so the bottom bar stays at four.
 */

type IconName = "dashboard" | "stock" | "market" | "weather" | "alerts" | "settings" | "logout";

const PATHS: Record<IconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  stock: (
    <>
      <path d="M3.5 8.5 12 4l8.5 4.5L12 13 3.5 8.5Z" />
      <path d="m3.5 13 8.5 4.5L20.5 13" />
    </>
  ),
  market: (
    <>
      <path d="M3.5 17.5 9 11l4 3.5 7.5-8" />
      <path d="M15.5 6.5h5v5" />
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
};

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
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

/** The green tile the overview screen uses for the brand and the user. */
function BrandTile({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-shell bg-brand text-white ${className}`}
    >
      <Icon name="dashboard" className="h-6 w-6" />
    </span>
  );
}

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/stock", label: "Stock", icon: "stock" },
  { href: "/market", label: "Market", icon: "market" },
  { href: "/weather", label: "Weather", icon: "weather" },
  { href: "/alerts", label: "Alerts", icon: "alerts" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

/** The phone bottom bar keeps four daily destinations (docs/design.md §3);
 *  Alerts and Settings live in the phone top bar instead. */
const PHONE_NAV = NAV.filter((item) =>
  ["/dashboard", "/stock", "/market", "/weather"].includes(item.href),
);

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

function LogoutButton({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <form action={logoutAction}>
      <button type="submit" className={className ?? "btn-ghost w-full justify-start"}>
        <Icon name="logout" />
        {children ?? "Log out"}
      </button>
    </form>
  );
}

export function AppShell({
  children,
  userName,
  farmName,
}: {
  children: ReactNode;
  userName: string;
  farmName: string;
}) {
  const isActive = useIsActive();

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col justify-between border-r border-line bg-surface lg:flex">
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Brand header */}
          <div className="flex h-24 shrink-0 items-center gap-3 border-b border-line bg-surface-low px-6">
            <BrandTile />
            <div className="min-w-0">
              <p className="truncate font-display text-[22px] font-extrabold leading-tight tracking-tight text-ink">
                AgriPrice
              </p>
              <p className="truncate text-[13px] font-semibold uppercase tracking-wider text-brand">
                Sell now or hold
              </p>
            </div>
          </div>

          {/* Active farm telemetry chip */}
          <div className="shrink-0 px-6 py-5">
            <div className="flex items-center gap-3 rounded-shell border border-optimal-line bg-optimal-bg p-4">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-optimal opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-optimal" />
              </span>
              <div className="min-w-0">
                <p className="micro">Active farm</p>
                <p className="truncate text-[15px] font-extrabold text-ink">{farmName}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <ul className="space-y-2">
              {NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-[52px] items-center gap-4 rounded-shell px-5 py-3.5 font-display text-[15px] font-bold transition-colors ${
                        active
                          ? "bg-brand text-white"
                          : "text-ink hover:bg-surface-container hover:text-ink"
                      }`}
                    >
                      <Icon
                        name={item.icon}
                        className={`h-6 w-6 shrink-0 ${active ? "text-white" : "text-ink-muted"}`}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* User footer */}
        <div className="shrink-0 border-t border-line bg-surface-low p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand font-display text-[15px] font-bold text-white">
                {userName.trim().charAt(0).toUpperCase() || "F"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold leading-tight text-ink">{userName}</p>
                <p className="truncate text-xs font-medium text-ink-muted">Farmer</p>
              </div>
            </div>
            <LogoutButton className="btn-ghost shrink-0">
              <Icon name="logout" />
              <span className="sr-only">Log out</span>
            </LogoutButton>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Phone and tablet bar */}
        <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur lg:hidden">
          <div className="flex min-h-[64px] items-center justify-between gap-3 px-4">
            <div className="flex min-w-0 items-center gap-3">
              <BrandTile className="h-9 w-9" />
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-extrabold tracking-tight">
                  AgriPrice
                </p>
                <p className="truncate text-xs font-semibold uppercase tracking-wider text-brand">
                  {farmName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/alerts"
                aria-current={isActive("/alerts") ? "page" : undefined}
                className="btn-ghost"
              >
                <Icon name="alerts" />
                <span className="sr-only">Alerts</span>
              </Link>
              <Link
                href="/settings"
                aria-current={isActive("/settings") ? "page" : undefined}
                className="btn-ghost"
              >
                <Icon name="settings" />
                <span className="sr-only">Settings</span>
              </Link>
              <LogoutButton className="btn-ghost">
                <Icon name="logout" />
                <span className="sr-only">Log out</span>
              </LogoutButton>
            </div>
          </div>

          <nav aria-label="Main" className="hidden border-t border-line px-2 sm:block lg:hidden">
            <ul className="flex items-center gap-1 overflow-x-auto py-1">
              {NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-input px-3 py-2 text-[13px] font-medium transition-colors ${
                        active ? "bg-brand text-white" : "text-ink-muted hover:bg-surface-dim"
                      }`}
                    >
                      <Icon name={item.icon} className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-board flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          {children}
        </main>

        <footer className="border-t border-line bg-surface px-4 py-6 text-[13px] text-ink-muted sm:px-6 lg:px-8">
          <p className="mx-auto max-w-board">
            Decision-support tool. You decide. · Prices are simulated until a reviewed live source
            is connected.
          </p>
        </footer>
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        <ul className="grid grid-cols-4">
          {PHONE_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-semibold ${
                    active ? "text-brand" : "text-ink-muted"
                  }`}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
