"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";

/**
 * Dashboard shell (docs/design.md §3, Agriculture web):
 * - 1024 px and up: left sidebar 240 px + content grid.
 * - 640–1023 px: top bar + the same links across the top.
 * - under 640 px: top bar + bottom navigation with 4 items. Settings lives in
 *   the top bar on phones so the bottom bar keeps the four daily destinations.
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
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 12 4.6a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 19.4 11a2 2 0 1 1 0 4Z" />
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
      <aside className="hidden w-60 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
        <div className="px-5 py-6">
          <p className="text-sm font-medium text-accent">Agro-analytics</p>
          <p className="text-xl font-semibold tracking-tight">AgriPrice</p>
        </div>
        <nav aria-label="Main" className="flex-1 px-3">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`flex min-h-[48px] items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-success-bg text-accent"
                      : "text-muted hover:bg-bg hover:text-text"
                  }`}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-border p-3">
          <p className="px-2 pb-1 text-sm font-medium">{userName}</p>
          <p className="px-2 pb-2 text-sm text-muted">{farmName}</p>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur lg:hidden">
          <div className="flex min-h-[56px] items-center justify-between gap-3 px-4">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">AgriPrice</p>
              <p className="truncate text-sm text-muted">{farmName}</p>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/alerts"
                aria-current={isActive("/alerts") ? "page" : undefined}
                className="btn-ghost"
              >
                <Icon name="alerts" />
                <span>Alerts</span>
              </Link>
              <Link
                href="/settings"
                aria-current={isActive("/settings") ? "page" : undefined}
                className="btn-ghost"
              >
                <Icon name="settings" />
                <span>Settings</span>
              </Link>
              <LogoutButton className="btn-ghost">
                <Icon name="logout" />
                <span>Log out</span>
              </LogoutButton>
            </div>
          </div>

          <nav aria-label="Main" className="hidden border-t border-border px-2 sm:block lg:hidden">
            <ul className="flex items-center gap-1 overflow-x-auto py-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={`flex min-h-[48px] items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive(item.href)
                        ? "bg-success-bg text-accent"
                        : "text-muted hover:bg-bg hover:text-text"
                    }`}
                  >
                    <Icon name={item.icon} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
          {children}
        </main>

        <footer className="border-t border-border px-4 py-6 text-sm text-muted sm:px-6">
          <p className="mx-auto max-w-[1280px]">
            Decision-support tool. You decide. · Prices are simulated until a reviewed live source
            is connected.
          </p>
        </footer>
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        <ul className="grid grid-cols-4">
          {PHONE_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-sm font-medium ${
                  isActive(item.href) ? "text-accent" : "text-muted"
                }`}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
