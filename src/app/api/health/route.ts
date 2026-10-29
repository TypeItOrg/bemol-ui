import { isApiReady } from "@common/services/api-readiness.service";

export async function GET(): Promise<Response> {
  const ready = await isApiReady();

  return Response.json(
    { status: ready ? "ok" : "unavailable" },
    {
      status: ready ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
        ...(!ready && { "Retry-After": "5" }),
      },
    },
  );
}
