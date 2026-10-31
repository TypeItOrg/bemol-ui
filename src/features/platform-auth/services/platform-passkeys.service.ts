import "server-only";

import { RECENT_AUTH_REQUIRED } from "@features/institutional-auth/constants/passkey.constants";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

export async function platformPasskeyRequest<T>(path: string, method: string, body?: unknown): Promise<T> {
  const response = await platformApiFetch(`/api/v1/admin/auth/passkeys${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const error = (await response.json()) as { code?: string; message?: string };

    throw new Error(error.code === RECENT_AUTH_REQUIRED ? RECENT_AUTH_REQUIRED : error.message || "No se pudo completar la operación.");
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}
