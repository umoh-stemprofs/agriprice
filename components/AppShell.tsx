"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";
import { Icon, type IconName } from "@/components/ui/icons";

/**
 * The app shell, rebuilt to the desktop screens in
 * stitch_agropulse_analytics_dashboard (farm_overview_simple and
 * grain_storage_simple), which share one anatomy:
 *
 *   fixed sidebar (288px)
 *     64px brand header on a faint fill, hairline divider
 *     an "active farm" block, then a search field, then a live status chip
 *     nav rows: solid green + white when active, muted ink otherwise
 *     a footer block on the same faint fill carrying the user and logout
 *   fixed 64px top bar, offset by the sidebar
 *     breadcrumb or status chip on the left
 *     farm pill, notification bell, hairline divider, avatar on the right
 *   the page column, clamped to 1400px
 *
 * Breakpoints keep the behaviour docs/design.md §3 asks for:
 * - 1024px and up: the sidebar and top bar.
 * - 640-1023px: a sticky brand bar with a scrollable link row.
 * - under 640px: the same bar plus a bottom nav of four daily destinations;
 *   Alerts and Settings move to the top bar so the bottom bar stays at four.
 */

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/market", label: "Market", icon: "market" },
  { href: "/stock", label: "Stock", icon: "stock" },
  { href: "/weather", label: "Weather", icon: "weather" },
  { href: "/alerts", label: "Alerts", icon: "alerts" },
  { href: "/costs", label: "Cost of waiting", icon: "costs" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

/** The phone bottom bar keeps four daily destinations (docs/design.md §3). */
const PHONE_NAV = NAV.filter((item) =>
  ["/dashboard", "/market", "/stock", "/weather"].includes(item.href),
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

/** Green tile the brand header and the user block share. */
function BrandTile({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-tile bg-brand text-white ${className}`}
    >
      <Icon name="sprout" className="h-6 w-6" />
    </span>
  );
}

/** The one-line breadcrumb the top bar leads with. */
function Crumbs({ items }: { items: string[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-label-md text-ink-muted">
      {items.map((item, index) => (
        <span key={item} className="flex min-w-0 items-center gap-1.5">
          {index > 0 && <Icon name="chevronRight" className="h-4 w-4 text-ink-faint" />}
          <span
            className={`truncate ${
              index === items.length - 1 ? "font-semibold text-ink" : "hover:text-ink"
            }`}
          >
            {item}
          </span>
        </span>
      ))}
    </nav>
  );
}

export function AppShell({
  children,
  userName,
  farmName,
  /** Left side of the top bar: a breadcrumb, or a status chip. */
  crumb,
  /** Right side of the top bar, before the farm pill. */
  action,
  /** Shown under the top bar's live chip when the page asks for it. */
  status,
}: {
  children: ReactNode;
  userName: string;
  farmName: string;
  crumb?: string[];
  action?: ReactNode;
  status?: ReactNode;
}) {
  const isActive = useIsActive();
  const initials =
    userName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "F";

  return (
    <div className="min-h-screen lg:flex">
      {/* ---------------------------------------------------------- sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col justify-between border-r border-line bg-surface lg:flex">
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Brand header */}
          <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-line bg-surface-low px-6">
            <BrandTile />
            <div className="min-w-0">
              <p className="truncate font-display text-headline-sm font-bold leading-tight tracking-tight text-ink">
                AgriPrice
              </p>
              <p className="truncate text-label-sm uppercase tracking-wider text-brand">
                Sell now or hold
              </p>
            </div>
          </div>

          {/* Active farm block */}
          <div className="shrink-0 space-y-3 p-4">
            <div className="flex items-center justify-between gap-2 rounded-panel border border-line bg-surface-container p-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <Icon name="warehouse" className="h-5 w-5 shrink-0 text-brand" />
                <div className="min-w-0">
                  <p className="text-label-sm uppercase leading-none text-ink-muted">Active farm</p>
                  <p className="truncate text-[15px] font-semibold leading-tight text-ink">
                    {farmName}
                  </p>
                </div>
              </div>
              <Icon name="chevronDown" className="h-4 w-4 shrink-0 text-ink-muted" />
            </div>

            {/* Live status */}
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="chip border-optimal-line bg-optimal-bg font-semibold text-brand">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-optimal opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-optimal" />
                </span>
                Live market feed
              </span>
              <span className="text-code tabular text-ink-muted">{new Date().getFullYear()}</span>
            </div>
          </div>

          {/* Nav */}
          <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <ul className="space-y-1">
              {NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-[44px] items-center gap-3 rounded-card px-3.5 py-2.5 text-label-md transition-colors ${
                        active
                          ? "bg-brand font-semibold text-white shadow-lift"
                          : "text-ink-muted hover:bg-surface-container hover:text-ink"
                      }`}
                    >
                      <Icon name={item.icon} className={`h-5 w-5 ${active ? "text-white" : ""}`} />
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
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-bold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-label-md font-semibold leading-tight text-ink">
                  {userName}
                </p>
                <p className="truncate text-label-sm leading-none text-ink-muted">Farm owner</p>
              </div>
            </div>
            <LogoutButton className="btn-ghost shrink-0 px-2">
              <Icon name="logout" className="h-4 w-4" />
              <span className="sr-only">Log out</span>
            </LogoutButton>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------ main */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Top bar. On phones this is also the brand bar. */}
        <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
          <div className="flex min-h-[64px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <span className="lg:hidden">
                <BrandTile className="h-9 w-9" />
              </span>
              {crumb ? <Crumbs items={crumb} /> : <Crumbs items={["AgriPrice", farmName]} />}
              {status && <span className="hidden md:inline-flex">{status}</span>}
            </div>

            <div className="flex items-center gap-2">
              {action}
              <span className="hidden items-center gap-1.5 rounded-card border border-line bg-surface-lower px-2.5 py-1.5 text-label-md text-ink sm:flex">
                <Icon name="location" className="h-4 w-4 text-ink-muted" />
                <span className="max-w-[10rem] truncate">{farmName}</span>
              </span>
              <Link
                href="/alerts"
                aria-current={isActive("/alerts") ? "page" : undefined}
                className="btn-ghost relative px-2"
              >
                <Icon name="bell" className="h-5 w-5" />
                <span className="sr-only">Alerts</span>
              </Link>
              <span className="hidden h-5 w-px bg-line sm:block" />
              <Link
                href="/settings"
                aria-current={isActive("/settings") ? "page" : undefined}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-bold text-white lg:hidden"
                aria-label="Settings"
              >
                {initials}
              </Link>
              <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-bold text-white lg:flex">
                {initials}
              </span>
            </div>
          </div>

          {/* Tablet link row */}
          <nav aria-label="Main" className="hidden border-t border-line px-2 sm:block lg:hidden">
            <ul className="flex items-center gap-1 overflow-x-auto py-1">
              {NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-input px-3 py-2 text-label-md transition-colors ${
                        active ? "bg-brand text-white" : "text-ink-muted hover:bg-surface-dim"
                      }`}
                    >
                      <Icon name={item.icon} className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-page flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Phone bottom nav */}
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
                  className={`flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-label-sm ${
                    active ? "text-brand" : "text-ink-muted"
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
    </div>
  );
}
