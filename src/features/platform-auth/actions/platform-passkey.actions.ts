"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { z } from "zod";

import { requirePlatformHost } from "@common/services/institutional-host/institutional-host.service";
import { publicApiFetch } from "@common/services/public-api-fetch.service";

import { passkeyLabelSchema } from "@features/institutional-auth/schemas/passkey-label.schema";
import type { PasskeyCreationOptionsJson } from "@features/institutional-auth/types/passkey-creation-options-json.types";
import type { ReAuthenticateState } from "@features/institutional-auth/types/re-authenticate-state.types";
import type { RenamePasskeyState } from "@features/institutional-auth/types/rename-passkey-state.types";
import type { RequestPasskeyRegistrationState } from "@features/institutional-auth/types/request-passkey-registration-state.types";
import type { RevokePasskeyState } from "@features/institutional-auth/types/revoke-passkey-state.types";
import type { VerifyPasskeyRegistrationState } from "@features/institutional-auth/types/verify-passkey-registration-state.types";
import { platformPasskeyRequest } from "@features/platform-auth/services/platform-passkeys.service";
import type { PlatformLoginResult } from "@features/platform-auth/types/platform-login-result.types";
import type { PlatformPasskeyOptions } from "@features/platform-auth/types/platform-passkey-options.types";
import { clearPlatformAuthCookies, setPlatformAuthCookies } from "@features/platform-auth/utils/platform-auth-cookies.util";
import { PLATFORM_LOGIN_PATH } from "@features/platform-auth/utils/platform-auth-proxy-policy.util";
import { redirectToNext } from "@features/platform-auth/utils/platform-auth-redirect.util";

const uuid = z.uuid();

const setupSchema = z.object({ code: z.string().regex(/^[a-f0-9]{64}$/), label: z.string().trim().min(1).max(100) });

const verifySchema = z.object({ ceremonyId: uuid, credential: z.record(z.string(), z.unknown()) });

function message(error: unknown): string {
  return error instanceof Error ? error.message : "No se pudo completar la operación.";
}

async function loginRequest<T>(path: string, body: unknown): Promise<T> {
  const requestHeaders = await headers();

  requirePlatformHost(requestHeaders);

  const response = await publicApiFetch(
    `/api/v1/admin/auth/passkeys/${path}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    requestHeaders,
  );

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };

    throw new Error(error.message || "No se pudo verificar la llave de acceso. Volvé a iniciar sesión.");
  }

  return (await response.json()) as T;
}

export async function beginPlatformPasskey(loginAttemptId: string, setup?: { code: string; label: string }): Promise<PlatformPasskeyOptions> {
  const id = uuid.parse(loginAttemptId);

  const parsed = setup === undefined ? undefined : setupSchema.parse(setup);

  return loginRequest(parsed ? "setup/options" : "authentication/options", { loginAttemptId: id, ...parsed });
}

export async function finishPlatformPasskey(ceremonyId: string, credential: unknown, setup: boolean, next: unknown): Promise<void> {
  const parsed = verifySchema.parse({ ceremonyId, credential });

  if (typeof setup !== "boolean") {
    throw new Error("Solicitud inválida.");
  }

  const result = await loginRequest<PlatformLoginResult>(setup ? "setup/verify" : "authentication/verify", parsed);

  await setPlatformAuthCookies(result.tokens);
  redirectToNext(typeof next === "string" ? next : null);
}

export async function beginPlatformPasskeyReauth(target: string): Promise<PlatformPasskeyOptions> {
  const parsed = z.union([z.literal("register"), z.string().regex(/^revoke:[a-f0-9-]{36}$/)]).parse(target);

  return platformPasskeyRequest("/reauth/options", "POST", { target: parsed });
}

export async function finishPlatformPasskeyReauth(ceremonyId: string, credential: unknown): Promise<ReAuthenticateState> {
  try {
    await platformPasskeyRequest("/reauth/verify", "POST", verifySchema.parse({ ceremonyId, credential }));

    return { success: true };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function requestPlatformPasskeyRegistration(
  _previous: RequestPasskeyRegistrationState,
  formData: FormData,
): Promise<RequestPasskeyRegistrationState> {
  const parsed = passkeyLabelSchema.safeParse({ label: formData.get("label") });

  if (!parsed.success) {
    return { error: "Ingresá un nombre de hasta 100 caracteres." };
  }

  try {
    return await platformPasskeyRequest<{ ceremonyId: string; options: PasskeyCreationOptionsJson }>("/registration/options", "POST", parsed.data);
  } catch (error) {
    return { error: message(error) };
  }
}

export async function verifyPlatformPasskeyRegistration(ceremonyId: string, credential: unknown): Promise<VerifyPasskeyRegistrationState> {
  try {
    await platformPasskeyRequest("/registration/verify", "POST", verifySchema.parse({ ceremonyId, credential }));
  } catch (error) {
    return { error: message(error) };
  }

  revalidatePath("/admin/account/passkeys");

  return {};
}

export async function renamePlatformPasskey(id: string, _previous: RenamePasskeyState, formData: FormData): Promise<RenamePasskeyState> {
  const parsed = passkeyLabelSchema.safeParse({ label: formData.get("label") });

  if (!uuid.safeParse(id).success || !parsed.success) {
    return { error: "Ingresá un nombre de hasta 100 caracteres." };
  }

  try {
    await platformPasskeyRequest(`/${id}`, "PATCH", parsed.data);
  } catch (error) {
    return { error: message(error) };
  }

  revalidatePath("/admin/account/passkeys");

  return { success: true };
}

export async function revokePlatformPasskey(id: string): Promise<RevokePasskeyState> {
  if (!uuid.safeParse(id).success) {
    return { error: "La llave de acceso no es válida." };
  }

  try {
    await platformPasskeyRequest(`/${id}`, "DELETE");
  } catch (error) {
    return { error: message(error) };
  }

  await clearPlatformAuthCookies();
  redirect(PLATFORM_LOGIN_PATH);
}
