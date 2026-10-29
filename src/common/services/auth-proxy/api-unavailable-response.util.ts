import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { COMMON_ERROR_MESSAGES } from "@common/constants/error-messages.constants";
import { isApiReady } from "@common/services/api-readiness.service";

export async function getApiUnavailableResponse(request: NextRequest): Promise<NextResponse | undefined> {
  if (await isApiReady()) {
    return undefined;
  }

  const headers = { "Cache-Control": "no-store", "Retry-After": "5" };

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ message: COMMON_ERROR_MESSAGES.SESSION_UNAVAILABLE }, { status: 503, headers });
  }

  const documentNavigation =
    (request.method === "GET" || request.method === "HEAD") &&
    request.headers.get("accept")?.includes("text/html") &&
    !request.headers.has("rsc") &&
    !request.headers.has("next-action");

  if (!documentNavigation) {
    return new NextResponse(null, { status: 503, headers });
  }

  const destination = new URL("/maintenance.html", request.url);

  return NextResponse.rewrite(destination, { status: 503, headers });
}
