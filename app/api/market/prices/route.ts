import { marketProvider } from "@/lib/market/provider";
import { todayInTz } from "@/lib/market/dates";

export const dynamic = "force-dynamic";

/**
 * GET /api/market/prices — latest price of every crop.
 * Returns [{crop, date, priceKobo, unit, source}, ...] (docs/00-global.md §3).
 */
export async function GET(): Promise<Response> {
  const today = todayInTz();
  const result = await marketProvider().latestPrices(today);
  return Response.json(result.ticks, {
    headers: { "cache-control": "no-store" },
  });
}
