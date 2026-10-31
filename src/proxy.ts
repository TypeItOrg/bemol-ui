import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getApiUnavailableResponse } from "@common/services/auth-proxy/api-unavailable-response.util";
import { INSTITUTIONAL_UNAVAILABLE_PATH, RouteAccess, getRouteAccess } from "@common/services/auth-proxy/auth-proxy-route.util";
import { handleGuestOnlyRoute, handleProtectedRoute } from "@common/services/auth-proxy/auth-proxy.service";
import { classifyInstitutionalHost } from "@common/services/institutional-host/classify-institutional-host.util";
import { InstitutionalHostError } from "@common/services/institutional-host/institutional-host-error";
import { InstitutionalHostKind } from "@common/services/institutional-host/institutional-host-kind.types";
import {
  INSTITUTIONAL_HOST_HEADER,
  rebuildInstitutionalHostHeader,
  resolveRequestInstitution,
} from "@common/services/institutional-host/institutional-host.service";

import { tryAutoLogin } from "@features/institutional-auth/services/auto-login.service";
import { institutionalAuthProxyPolicy } from "@features/institutional-auth/utils/institutional-auth-proxy-policy.util";
import { platformAuthProxyPolicy } from "@features/platform-auth/utils/platform-auth-proxy-policy.util";
import { toPlatformInternalPath, toPlatformPublicPath } from "@features/platform-auth/utils/platform-route-paths.util";

export async function proxy(request: NextRequest): Promise<NextResponse> {
  // Never accept a client-provided internal tenant header, including on health probes.
  request.headers.delete(INSTITUTIONAL_HOST_HEADER);

  let routeAccess = getRouteAccess(request.nextUrl.pathname, request.nextUrl.searchParams);

  let platformPageDestination: URL | undefined;

  if (routeAccess === RouteAccess.HealthProbe) {
    return NextResponse.next({ request: { headers: new Headers(request.headers) } });
  }

  if (request.nextUrl.pathname === INSTITUTIONAL_UNAVAILABLE_PATH || request.nextUrl.pathname.startsWith("/_next/")) {
    return NextResponse.next({ request: { headers: new Headers(request.headers) } });
  }

  try {
    const forwardedHost = request.headers.get("x-forwarded-host");

    // Do not stream an action redirect rendered for Next's internal host.
    if (request.headers.get("rsc") === "1" && forwardedHost && forwardedHost !== request.headers.get("host")) {
      throw new InstitutionalHostError(404);
    }

    rebuildInstitutionalHostHeader(request.headers, request.headers);

    const host = classifyInstitutionalHost(request.headers.get("host"));

    const pathname = request.nextUrl.pathname;

    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      if (["GET", "HEAD"].includes(request.method)) {
        const destination = new URL(process.env.PLATFORM_PUBLIC_URL || "http://admin.localhost:3000");

        destination.pathname = toPlatformPublicPath(pathname);
        destination.search = request.nextUrl.search;

        return NextResponse.redirect(destination, { status: 303 });
      }

      return NextResponse.json({ message: "Acceso no disponible en este dominio." }, { status: 404 });
    }

    if (host.kind === InstitutionalHostKind.PLATFORM && !pathname.startsWith("/api/")) {
      // NextURL normalizes loopback hosts and can turn this into a self-proxying rewrite.
      platformPageDestination = new URL(request.url);
      platformPageDestination.pathname = toPlatformInternalPath(pathname);
      routeAccess = getRouteAccess(platformPageDestination.pathname, request.nextUrl.searchParams);
    }

    const adminRoute = routeAccess === RouteAccess.AdminGuestOnly || routeAccess === RouteAccess.AdminSession;

    if (adminRoute && host.kind !== InstitutionalHostKind.PLATFORM) {
      return NextResponse.json({ message: "Acceso no disponible en este dominio." }, { status: 404 });
    }

    if (host.kind === InstitutionalHostKind.PLATFORM) {
      if (routeAccess === RouteAccess.InstitutionalGuestOnly || routeAccess === RouteAccess.InstitutionalSession) {
        return new NextResponse(null, { status: 404 });
      }
    }

    await resolveRequestInstitution(request.headers);
  } catch (error) {
    const status = error instanceof InstitutionalHostError ? error.status : 503;

    if (status === 503) {
      const unavailable = await getApiUnavailableResponse(request);

      if (unavailable) {
        return unavailable;
      }
    }

    const message = error instanceof InstitutionalHostError ? error.message : "No se pudo consultar la institución. Intentá nuevamente.";

    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
    }

    // Let Next fall back to browser navigation instead of streaming a host-resolution error after an action redirect.
    if (request.headers.get("rsc") === "1") {
      return new NextResponse(null, { status, headers: { "Cache-Control": "no-store" } });
    }

    const destination = new URL(INSTITUTIONAL_UNAVAILABLE_PATH, request.url);

    destination.searchParams.set("status", String(status));
    destination.searchParams.set("message", message);

    return NextResponse.rewrite(destination, {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const autoLogin = await tryAutoLogin(request);

  if (autoLogin) {
    return autoLogin;
  }

  switch (routeAccess) {
    case RouteAccess.AdminGuestOnly:
      return handleGuestOnlyRoute(request, platformAuthProxyPolicy, platformPageDestination);
    case RouteAccess.AdminSession:
      return handleProtectedRoute(request, platformAuthProxyPolicy, platformPageDestination);
    case RouteAccess.InstitutionalGuestOnly:
      return handleGuestOnlyRoute(request, institutionalAuthProxyPolicy);
    case RouteAccess.InstitutionalSession:
      return handleProtectedRoute(request, institutionalAuthProxyPolicy);
    case RouteAccess.Public:
    case RouteAccess.HealthProbe:
      return NextResponse.next({ request: { headers: new Headers(request.headers) } });
  }
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
