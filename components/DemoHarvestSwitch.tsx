"use client";

import Link from "next/link";
import { useState } from "react";
import { DEMO_HARVEST_PREVIEW } from "@/lib/alerts/today";

/**
 * "Demo: show harvest alert" (step 1 of the final push).
 *
 * Rendered only when DEMO_MODE=true (the server page decides that). Flipping
 * the switch shows the harvest alert exactly as it would look, marked "Demo
 * preview". It reads nothing and writes nothing — no data changes.
 */
export function DemoHarvestSwitch() {
  const [show, setShow] = useState(false);
  const alert = DEMO_HARVEST_PREVIEW;

  return (
    <section className="card" aria-label="Demo controls">
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={show}
          onChange={(event) => setShow(event.target.checked)}
          className="h-5 w-5 accent-accent"
        />
        <span className="font-medium">Demo: show harvest alert</span>
      </label>
      <p className="mt-1 text-sm text-ink-muted">
        For the demo only. It shows the warning as it would look — nothing on the farm changes.
      </p>

      {show && (
        <div
          role="status"
          className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-card border border-warn-line bg-warn-bg p-4"
        >
          <div className="flex items-start gap-3">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-warn-text"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v10M8 9l4 4 4-4" />
              <path d="M5 16a3 3 0 0 0 3 3h8a3 3 0 0 0 0-6 5 5 0 0 0-9.6-1.4A3.5 3.5 0 0 0 5 16Z" />
            </svg>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-warn-text">{alert.word}</p>
                <span className="pill bg-info-bg text-info-text">Demo preview</span>
              </div>
              <p className="mt-1 text-ink-muted">{alert.sentence}</p>
              <Link href={alert.href} className="btn-secondary mt-3">
                {alert.action}
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
