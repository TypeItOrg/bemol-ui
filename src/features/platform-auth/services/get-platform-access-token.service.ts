import "server-only";

import { cookies, headers } from "next/headers";

import { requirePlatformHost } from "@common/services/institutional-host/institutional-host.service";

import { PLATFORM_ACCESS_TOKEN_COOKIE } from "@features/platform-auth/utils/platform-auth-cookies.util";

export async function getPlatformAccessToken(): Promise<string | undefined> {
  requirePlatformHost(await headers());

  const cookieStore = await cookies();

  return cookieStore.get(PLATFORM_ACCESS_TOKEN_COOKIE)?.value;
}
