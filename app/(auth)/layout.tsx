import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <header className="mb-6">
            <Link href="/" className="inline-block">
              <p className="text-sm font-medium text-brand">Agro-analytics</p>
              <p className="text-3xl font-bold tracking-tight">AgriPrice</p>
            </Link>
            <p className="mt-2 text-ink-muted">
              Sell now or hold, with today&apos;s prices and the weather for your farm.
            </p>
          </header>

          <div className="card">{children}</div>

          <p className="mt-6 text-sm text-ink-muted">
            Decision-support tool. You decide. · Prices are simulated until a reviewed live source
            is connected.
          </p>
        </div>
      </main>
    </div>
  );
}
