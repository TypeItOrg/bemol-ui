import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { publicApiFetch } from "@common/services/public-api-fetch.service";
import { createAuthRequestHeaders } from "@common/utils/auth-request-headers.util";

import type { InstitutionalLoginResult } from "@features/institutional-auth/types/institutional-login-result.types";
import {
  INSTITUTIONAL_ACCESS_TOKEN_COOKIE,
  INSTITUTIONAL_REFRESH_TOKEN_COOKIE,
} from "@features/institutional-auth/utils/institutional-auth-cookies.util";
import { institutionalAuthProxyPolicy } from "@features/institutional-auth/utils/institutional-auth-proxy-policy.util";
import { PLATFORM_ACCESS_TOKEN_COOKIE, PLATFORM_REFRESH_TOKEN_COOKIE } from "@features/platform-auth/utils/platform-auth-cookies.util";

export async function tryStagingAutoLogin(request: NextRequest): Promise<NextResponse | undefined> {
  if (
    process.env.DEPLOYMENT_ENV !== "staging" ||
    process.env.AUTO_LOGIN_ENABLED !== "true" ||
    request.method !== "GET" ||
    request.nextUrl.pathname !== "/" ||
    request.headers.has("rsc") ||
    request.headers.has("next-router-prefetch") ||
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("sec-purpose")?.includes("prefetch") ||
    [INSTITUTIONAL_ACCESS_TOKEN_COOKIE, INSTITUTIONAL_REFRESH_TOKEN_COOKIE, PLATFORM_ACCESS_TOKEN_COOKIE, PLATFORM_REFRESH_TOKEN_COOKIE].some(
      (name) => request.cookies.has(name),
    )
  ) {
    return undefined;
  }

  try {
    const publicUrl = new URL(process.env.FRONTEND_PUBLIC_URL ?? "");

    if (publicUrl.protocol !== "https:" || request.headers.get("host") !== publicUrl.host) {
      return undefined;
    }

    const response = await publicApiFetch(
      "/api/v1/auth/login/staging",
      { method: "POST", headers: createAuthRequestHeaders(request.headers) },
      request.headers,
    );

    if (!response.ok) {
      return undefined;
    }

    const payload = (await response.json()) as Partial<InstitutionalLoginResult>;

    const tokens = payload.tokens;

    if (typeof tokens?.accessToken !== "string" || !tokens.accessToken || typeof tokens.refreshToken !== "string" || !tokens.refreshToken) {
      return undefined;
    }

    const redirect = NextResponse.redirect(new URL("/", publicUrl), { status: 303, headers: { "Cache-Control": "private, no-store" } });

    institutionalAuthProxyPolicy.setRefreshedCookies(redirect, tokens);

    return redirect;
  } catch {
    // An unavailable or disabled demo falls back to the ordinary login, without a redirect loop.
    return undefined;
  }
}
