import "server-only";

import { headers } from "next/headers";

import { authenticatedApiFetch } from "@common/services/authenticated-api-fetch.service";

import { getPlatformAccessToken } from "@features/platform-auth/services/get-platform-access-token.service";
import { clearPlatformAuthCookies } from "@features/platform-auth/utils/platform-auth-cookies.util";

export async function logoutPlatformAccount(): Promise<void> {
  const accessToken = await getPlatformAccessToken();

  if (!accessToken) {
    return;
  }

  try {
    await authenticatedApiFetch("/api/v1/admin/auth/logout", accessToken, { method: "POST" }, await headers());
  } catch {
    await clearPlatformAuthCookies();
  }
}
