"use client";

import type { Crop } from "@prisma/client";
import { useState, type FormEvent } from "react";
import { saveCropCostsAction } from "@/app/actions/costs";
import { MoneyLine } from "@/components/MoneyLine";
import { SourceBadge } from "@/components/SourceBadge";
import { StatusPill } from "@/components/StatusPill";
import { formatNaira } from "@/lib/format";
import { sellWindow } from "@/lib/sellWindow";

/**
 * Cost-of-waiting form (docs/01-agriprice.md step 4).
 *
 * The preview on the right runs the same pure sellWindow function on the same
 * prices as the dashboard and the crop page, as the numbers change — and it
 * never writes anything: only the Save button posts to the server action.
 */

export interface CostsFormProps {
  crop: Crop;
  label: string;
  unitLabel: string;
  /** Last daily prices, oldest -> newest, in kobo (what sellWindow expects). */
  pricesKobo: number[];
  /** Stock the farm holds of this crop, in kg. */
  qtyKg: number;
  latestKobo: number;
  initial: {
    storageNaira: number;
    spoilagePctPerWeek: number;
    minGainPct: number;
  };
}

function numberOr(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function CostsForm({
  crop,
  label,
  unitLabel,
  pricesKobo,
  qtyKg,
  latestKobo,
  initial,
}: CostsFormProps) {
  const [storageNaira, setStorageNaira] = useState(String(initial.storageNaira));
  const [spoilage, setSpoilage] = useState(String(initial.spoilagePctPerWeek));
  const [minGain, setMinGain] = useState(String(initial.minGainPct));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Preview maths. A half-typed or cleared field counts as 0 for the preview
  // only; saving still goes through Zod on the server.
  const preview = sellWindow(pricesKobo, qtyKg, {
    storageKoboPerKgPerWeek: Math.round(Math.max(0, numberOr(storageNaira, 0)) * 100),
    spoilagePctPerWeek: Math.max(0, numberOr(spoilage, 0)),
    minGainPct: Math.max(0, numberOr(minGain, 0)),
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);
    try {
      const result = await saveCropCostsAction(new FormData(event.currentTarget));
      if (result.error) setError(result.error);
      else setNotice(result.message ?? "Costs saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <form className="card space-y-4" onSubmit={onSubmit} noValidate>
        <div>
          <h2 className="text-xl font-semibold">Cost of waiting for {label}</h2>
          <p className="text-ink-muted">Per week. Sample numbers — an expert must review them.</p>
        </div>

        <input type="hidden" name="crop" value={crop} />

        <div>
          <label htmlFor="storage-naira" className="label">
            Storage cost per kg per week (₦)
          </label>
          <input
            id="storage-naira"
            name="storageNaira"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            value={storageNaira}
            onChange={(event) => setStorageNaira(event.target.value)}
            className="input"
            aria-describedby="storage-help"
          />
          <p id="storage-help" className="mt-1 text-sm text-ink-muted">
            What one week in the store costs for each kg of {label.toLowerCase()}.
          </p>
        </div>

        <div>
          <label htmlFor="spoilage" className="label">
            Spoilage per week (%)
          </label>
          <input
            id="spoilage"
            name="spoilagePctPerWeek"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            max={100}
            value={spoilage}
            onChange={(event) => setSpoilage(event.target.value)}
            className="input"
            aria-describedby="spoilage-help"
          />
          <p id="spoilage-help" className="mt-1 text-sm text-ink-muted">
            Share of the stock lost each week, between 0 and 100.
          </p>
        </div>

        <div>
          <label htmlFor="min-gain" className="label">
            Minimum gain to wait (%)
          </label>
          <input
            id="min-gain"
            name="minGainPct"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            max={100}
            value={minGain}
            onChange={(event) => setMinGain(event.target.value)}
            className="input"
            aria-describedby="min-gain-help"
          />
          <p id="min-gain-help" className="mt-1 text-sm text-ink-muted">
            Wait only if one week would gain at least this much.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-input border border-loss-line bg-loss-bg px-3 py-2 text-loss-text"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="rounded-input border border-optimal-line bg-optimal-bg px-3 py-2 text-optimal-text"
          >
            {notice}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save costs"}
        </button>
      </form>

      <section className="card" aria-label="Live preview">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Preview</h2>
            <p className="text-ink-muted">Nothing is saved until you press Save costs.</p>
          </div>
          <SourceBadge kind="simulated" />
        </div>

        <div className="mt-4">
          <StatusPill status={preview.status} />
        </div>

        <p className="mt-3">{preview.message}</p>
        <MoneyLine status={preview.status} changeIfWaitKobo={preview.changeIfWaitKobo} />

        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-card border border-line p-3">
            <dt className="text-sm font-medium text-ink-muted">Price today</dt>
            <dd className="mt-1 font-semibold tabular-nums">
              {formatNaira(latestKobo)}
              <span className="text-sm font-normal text-ink-muted"> / {unitLabel}</span>
            </dd>
          </div>
          <div className="rounded-card border border-line p-3">
            <dt className="text-sm font-medium text-ink-muted">Cost of waiting</dt>
            <dd className="mt-1 font-semibold tabular-nums">
              {formatNaira(preview.holdCostPerKgKobo)}
              <span className="text-sm font-normal text-ink-muted"> / kg / week</span>
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-sm text-ink-muted">
          Your stock: {qtyKg.toLocaleString("en-NG")} kg
          {qtyKg === 0 && " — you do not hold this crop yet, so the money line reads ₦0."}
        </p>
      </section>
    </div>
  );
}
