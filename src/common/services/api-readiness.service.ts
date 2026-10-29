import "server-only";

import { getApiUrlOrThrow } from "@common/utils/get-api-url-or-throw.util";

export async function isApiReady(): Promise<boolean> {
  try {
    const response = await fetch(new URL("/actuator/health/readiness", getApiUrlOrThrow()), {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(3_000),
    });

    if (!response.ok) {
      return false;
    }

    const payload: unknown = await response.json();

    return typeof payload === "object" && payload !== null && "status" in payload && payload.status === "UP";
  } catch {
    return false;
  }
}
