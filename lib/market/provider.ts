import { Crop, PriceSource } from "@prisma/client";
import { MARKET } from "@/lib/config";
import { historyFor, latestTicks, MarketTick } from "./generator";
import { priceListSchema } from "./schemas";

/**
 * MarketProvider adapter (docs/00-global.md §3).
 *
 * SimulatedProvider is the default and always works. When MARKET_API_URL is
 * set, LiveProvider calls that feed and falls back to the simulated one on
 * any failure (network error, timeout, bad status, or a response that does
 * not match our schema), so a real source can be added later without touching
 * the routes. The badge always shows which one actually answered.
 */

export interface MarketResult {
  ticks: MarketTick[];
  /** What the badge shows: "Simulated" or "Live". */
  label: string;
  source: PriceSource;
}

export interface MarketProvider {
  readonly label: string;
  readonly source: PriceSource;
  /** Latest price of every crop for `today` (YYYY-MM-DD in APP_TZ). */
  latestPrices(today: string): Promise<MarketResult>;
  /** Daily prices for one crop ending on `endDate`, oldest first. */
  history(crop: Crop, endDate: string, days: number): Promise<MarketResult>;
}

export class SimulatedProvider implements MarketProvider {
  readonly label = "Simulated";
  readonly source = PriceSource.SIMULATED;

  async latestPrices(today: string): Promise<MarketResult> {
    return { ticks: latestTicks(today), label: this.label, source: this.source };
  }

  async history(crop: Crop, endDate: string, days: number): Promise<MarketResult> {
    return { ticks: historyFor(crop, endDate, days), label: this.label, source: this.source };
  }
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class LiveProvider implements MarketProvider {
  readonly label = "Live";
  readonly source = PriceSource.LIVE;
  private readonly fallback: SimulatedProvider;

  constructor(
    private readonly baseUrl: string = process.env.MARKET_API_URL ?? "",
    private readonly fetchImpl: FetchLike = fetch,
  ) {
    this.fallback = new SimulatedProvider();
  }

  /** One GET against the real feed, validated with Zod. Throws on any problem. */
  private async get(path: string): Promise<MarketTick[]> {
    const url = `${this.baseUrl.replace(/\/$/, "")}${path}`;
    const response = await this.fetchImpl(url, {
      signal: AbortSignal.timeout(MARKET.liveTimeoutMs),
    });
    if (!response.ok) {
      throw new Error(`Market feed responded with HTTP ${response.status}.`);
    }
    const json: unknown = await response.json();
    const parsed = priceListSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error(`Market feed returned an unexpected shape: ${parsed.error.issues[0]?.message ?? ""}`);
    }
    return parsed.data.map((tick) => ({ ...tick }));
  }

  private async orSimulated(
    run: () => Promise<MarketTick[]>,
    fallbackRun: () => Promise<MarketResult>,
  ): Promise<MarketResult> {
    try {
      return { ticks: await run(), label: this.label, source: this.source };
    } catch (error) {
      console.warn(
        "Market feed unavailable, using the simulated feed:",
        error instanceof Error ? error.message : error,
      );
      return fallbackRun();
    }
  }

  async latestPrices(today: string): Promise<MarketResult> {
    return this.orSimulated(
      () => this.get(`/prices?date=${today}`),
      () => this.fallback.latestPrices(today),
    );
  }

  async history(crop: Crop, endDate: string, days: number): Promise<MarketResult> {
    return this.orSimulated(
      () => this.get(`/history?crop=${crop}&days=${days}&endDate=${endDate}`),
      () => this.fallback.history(crop, endDate, days),
    );
  }
}

/** The provider this deployment uses. Simulated unless MARKET_API_URL is set. */
export function marketProvider(fetchImpl?: FetchLike): MarketProvider {
  const baseUrl = process.env.MARKET_API_URL?.trim();
  if (baseUrl) return new LiveProvider(baseUrl, fetchImpl);
  return new SimulatedProvider();
}
