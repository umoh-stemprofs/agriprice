import { farmLocation, getWeather } from "@/lib/weather/provider";

export const dynamic = "force-dynamic";

/**
 * GET /api/weather — the farm's forecast, fetched from the server only.
 * Response is either {ok:true, data, badge} or {ok:false, error}.
 * Listed in docs/api.md with the exact external URL pattern.
 */
export async function GET(): Promise<Response> {
  const { lat, lon } = await farmLocation();
  const result = await getWeather(lat, lon);
  return Response.json(result, {
    status: result.ok ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
