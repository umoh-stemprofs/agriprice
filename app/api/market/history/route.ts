import { Crop } from "@prisma/client";
import { historyQuerySchema } from "@/lib/market/schemas";
import { marketProvider } from "@/lib/market/provider";
import { todayInTz } from "@/lib/market/dates";

export const dynamic = "force-dynamic";

/**
 * GET /api/market/history?crop=MAIZE&days=30 (days max 90).
 * Returns [{crop, date, priceKobo, unit, source}, ...] oldest first.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const rawCrop = url.searchParams.get("crop");
  if (!rawCrop) {
    return Response.json(
      { error: "Send a crop, for example ?crop=MAIZE." },
      { status: 400 },
    );
  }

  const parsed = historyQuerySchema.safeParse({
    crop: rawCrop,
    days: url.searchParams.get("days") ?? 30,
  });
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Check the query string." },
      { status: 400 },
    );
  }

  const { crop, days } = parsed.data as { crop: Crop; days: number };
  const today = todayInTz();
  const result = await marketProvider().history(crop, today, days);
  return Response.json(result.ticks, {
    headers: { "cache-control": "no-store" },
  });
}
