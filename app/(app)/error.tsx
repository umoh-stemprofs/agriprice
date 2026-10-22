"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Error boundary inside the app shell (docs/design.md §2: every screen has an
 * error state). A slow database or an unexpected failure shows this card with
 * one sentence and a way forward — never a raw stack trace or digest.
 * The (app) layout still renders around it, so navigation and the footer
 * disclaimer stay visible.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="card mx-auto max-w-lg text-center">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="mx-auto h-8 w-8 text-warn-text"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5V13M12 16.4v.2" />
      </svg>
      <h1 className="mt-3 text-xl font-semibold">Something went wrong on this page.</h1>
      <p className="mt-2 text-ink-muted">
        Nothing was lost — your stock and costs are still saved. Try the page again in a moment.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn-primary" onClick={reset}>
          Try again
        </button>
        <Link href="/dashboard" className="btn-secondary">
          Open dashboard
        </Link>
      </div>
    </div>
  );
}
