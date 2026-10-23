import { publicApiFetch } from "@common/services/public-api-fetch.service";
import type { BackendError } from "@common/types/backend-error.types";

import { INSTITUTIONAL_AUTH_ERROR_MESSAGES } from "@features/institutional-auth/constants/error-messages.constants";
import type { PasskeyRequestOptionsJson } from "@features/institutional-auth/types/passkey-request-options-json.types";

export type PasskeyAuthOptionsOutput =
  { success: true; data: { ceremonyId: string; options: PasskeyRequestOptionsJson } } | { success: false; error: BackendError };

export async function requestDiscoverablePasskeyAuthOptions(institutionId: string): Promise<PasskeyAuthOptionsOutput> {
  try {
    const response = await publicApiFetch("/api/v1/auth/passkeys/authentication/discoverable/options", {
      body: JSON.stringify({ institutionId }),
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!response.ok) {
      const error = (await response.json()) as BackendError;

      return { success: false, error };
    }

    return {
      success: true,
      data: (await response.json()) as { ceremonyId: string; options: PasskeyRequestOptionsJson },
    };
  } catch {
    return {
      success: false,
      error: { status: 500, message: INSTITUTIONAL_AUTH_ERROR_MESSAGES.PASSKEY_CONNECTION_FAILED },
    };
  }
}
