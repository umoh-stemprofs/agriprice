"use client";

import { useState, type FormEvent } from "react";
import { saveFarmAction } from "@/app/actions/farm";

export function FarmForm({
  farm,
}: {
  farm: { name: string; lat: number; lon: number };
}) {
  const [lat, setLat] = useState(farm.lat.toFixed(4));
  const [lon, setLon] = useState(farm.lon.toFixed(4));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [locating, setLocating] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);
    try {
      const result = await saveFarmAction(new FormData(event.currentTarget));
      if (result.error) setError(result.error);
      else setNotice(result.message ?? "Farm saved.");
    } finally {
      setPending(false);
    }
  }

  function useMyLocation() {
    setError(null);
    setNotice(null);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("This browser cannot find your location. Type the numbers instead.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(4));
        setLon(position.coords.longitude.toFixed(4));
        setNotice("Location filled in. Save to keep it.");
        setLocating(false);
      },
      () => {
        setError("We could not read your location. Type the numbers instead.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  return (
    <form className="mt-4 space-y-4" onSubmit={onSubmit} noValidate>
      <div>
        <label htmlFor="farm-name" className="label">
          Farm name
        </label>
        <input
          id="farm-name"
          name="name"
          type="text"
          defaultValue={farm.name}
          required
          maxLength={80}
          className="input"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="farm-lat" className="label">
            Latitude
          </label>
          <input
            id="farm-lat"
            name="lat"
            type="number"
            inputMode="decimal"
            step="0.0001"
            min={-90}
            max={90}
            value={lat}
            onChange={(event) => setLat(event.target.value)}
            required
            className="input"
            aria-describedby="lat-help"
          />
          <p id="lat-help" className="mt-1 text-sm text-ink-muted">
            Between −90 and 90.
          </p>
        </div>

        <div>
          <label htmlFor="farm-lon" className="label">
            Longitude
          </label>
          <input
            id="farm-lon"
            name="lon"
            type="number"
            inputMode="decimal"
            step="0.0001"
            min={-180}
            max={180}
            value={lon}
            onChange={(event) => setLon(event.target.value)}
            required
            className="input"
            aria-describedby="lon-help"
          />
          <p id="lon-help" className="mt-1 text-sm text-ink-muted">
            Between −180 and 180.
          </p>
        </div>
      </div>

      <button type="button" className="btn-secondary" onClick={useMyLocation} disabled={locating}>
        {locating ? "Finding location…" : "Use my location"}
      </button>

      {error && (
        <p role="alert" className="rounded-input border border-loss-line bg-loss-bg px-3 py-2 text-loss-text">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-input border border-optimal-line bg-optimal-bg px-3 py-2 text-optimal-text">
          {notice}
        </p>
      )}

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save farm"}
      </button>
    </form>
  );
}
