import { publicApiFetch } from "@common/services/public-api-fetch.service";
import type { BackendError } from "@common/types/backend-error.types";
import { createAuthRequestHeaders } from "@common/utils/auth-request-headers.util";

import type { LoginPlatformAccountOutput } from "@features/platform-auth/types/login-platform-account-output.types";
import type { PlatformLoginInput } from "@features/platform-auth/types/platform-login-input.types";
import type { PlatformLoginResponse } from "@features/platform-auth/types/platform-login-response.types";

export async function loginPlatformAccount(input: PlatformLoginInput, requestHeaders: Pick<Headers, "get">): Promise<LoginPlatformAccountOutput> {
  const response = await publicApiFetch(
    "/api/v1/admin/auth/login",
    {
      body: JSON.stringify(input),
      cache: "no-store",
      headers: createAuthRequestHeaders(requestHeaders),
      method: "POST",
    },
    requestHeaders,
  );

  if (!response.ok) {
    const error = (await response.json()) as BackendError;

    return { success: false, error };
  }

  const data = (await response.json()) as PlatformLoginResponse;

  return { success: true, data };
}
