import { DEFAULT_FARM } from "@/lib/config";
import { firstFarm, getWeather } from "@/lib/weather/provider";

export const dynamic = "force-dynamic";

/**
 * GET /api/weather — the farm's forecast, fetched from the server only.
 * Response is either {ok:true, data, badge} or {ok:false, error}.
 * Listed in docs/api.md with the exact external URL pattern.
 */
export async function GET(): Promise<Response> {
  const farm = await firstFarm();
  const result = await getWeather(farm?.lat ?? DEFAULT_FARM.lat, farm?.lon ?? DEFAULT_FARM.lon, {
    farmId: farm?.id ?? null,
  });
  return Response.json(result, {
    status: result.ok ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
