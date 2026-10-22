import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icons";

/**
 * Auth screens, restyled to the design system: a brand panel on the left
 * (desktop) with the three things the product does, and the form card on the
 * right. Under 1024px the brand panel collapses to a compact header above the
 * card, so nothing competes with the inputs on a phone.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  const points = [
    { icon: "market" as const, text: "One price per crop, updated every day." },
    { icon: "checkCircle" as const, text: "A plain sell-now or hold answer for each crop." },
    { icon: "weather" as const, text: "Your farm's weather, so rain never surprises you." },
  ];

  return (
    <div className="flex min-h-screen lg:flex">
      {/* Brand panel */}
      <aside className="hidden w-[440px] shrink-0 flex-col justify-between border-r border-line bg-surface p-10 lg:flex xl:w-[520px]">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-tile bg-brand text-white">
            <Icon name="sprout" className="h-6 w-6" />
          </span>
          <span>
            <span className="block font-display text-headline-sm font-bold leading-tight tracking-tight text-ink">
              AgriPrice
            </span>
            <span className="block text-label-sm uppercase tracking-wider text-brand">
              Sell now or hold
            </span>
          </span>
        </Link>

        <div>
          <h2 className="display text-display-md text-ink">
            Know what your harvest is worth before you sell it.
          </h2>
          <ul className="mt-6 space-y-3">
            {points.map((point) => (
              <li key={point.text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-card bg-leaf-100 text-brand">
                  <Icon name={point.icon} className="h-4 w-4" />
                </span>
                <span className="text-[15px] text-ink-muted">{point.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[13px] text-ink-muted">
          Decision-support tool. You decide. · Prices are simulated until a reviewed live source is
          connected.
        </p>
      </aside>

      {/* Form column */}
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <header className="mb-6 lg:hidden">
            <Link href="/" className="inline-block">
              <span className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-tile bg-brand text-white">
                  <Icon name="sprout" className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-label-sm uppercase tracking-wider text-brand">
                    Sell now or hold
                  </span>
                  <span className="block text-2xl font-bold tracking-tight text-ink">AgriPrice</span>
                </span>
              </span>
            </Link>
            <p className="mt-3 text-ink-muted">
              Today&apos;s prices and the weather for your farm.
            </p>
          </header>

          <div className="panel">{children}</div>

          <p className="mt-6 text-[13px] text-ink-muted lg:hidden">
            Decision-support tool. You decide. · Prices are simulated until a reviewed live source
            is connected.
          </p>
        </div>
      </main>
    </div>
  );
}
