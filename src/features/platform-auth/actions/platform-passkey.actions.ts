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
import type { PlatformPasskeyCeremonyMode } from "@features/platform-auth/types/platform-passkey-ceremony-mode.types";
import type { PlatformPasskeyOptions } from "@features/platform-auth/types/platform-passkey-options.types";
import { clearPlatformAuthCookies, setPlatformAuthCookies } from "@features/platform-auth/utils/platform-auth-cookies.util";
import { PLATFORM_LOGIN_PATH } from "@features/platform-auth/utils/platform-auth-proxy-policy.util";
import { redirectToNext } from "@features/platform-auth/utils/platform-auth-redirect.util";

const uuid = z.uuid();

function isShortTemporaryCode(value: string): boolean {
  return /^[A-Za-z0-9]{4}[\s-]?[A-Za-z0-9]{4}$/.test(value);
}

const setupSchema = z.object({
  code: z
    .string()
    .trim()
    .refine((value) => /^[a-f0-9]{64}$/.test(value) || isShortTemporaryCode(value), "Ingresá un código temporal válido."),
  label: passkeyLabelSchema.shape.label,
});

const enrollSchema = z.object({
  code: z.string().trim().refine(isShortTemporaryCode, "Ingresá el código de vinculación de 8 caracteres."),
  label: passkeyLabelSchema.shape.label,
});

const verifySchema = z.object({ ceremonyId: uuid, credential: z.record(z.string(), z.unknown()) });

const ceremonyModeSchema = z.enum(["verify", "setup", "enroll"]);

const CEREMONY_PATHS: Record<PlatformPasskeyCeremonyMode, string> = { verify: "authentication", setup: "setup", enroll: "enrollment" };

const REGISTRATION_SCHEMAS = { setup: setupSchema, enroll: enrollSchema };

function message(error: unknown): string {
  return error instanceof Error ? error.message : "No se pudo completar la operación.";
}

type LoginResponse<T> = { ok: true; data: T } | { ok: false; error: string };

async function loginRequest<T>(path: string, body: unknown): Promise<LoginResponse<T>> {
  const requestHeaders = await headers();

  requirePlatformHost(requestHeaders);

  let response: Response;

  try {
    response = await publicApiFetch(
      `/api/v1/admin/auth/passkeys/${path}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      requestHeaders,
    );
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor. Intentá nuevamente." };
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { message?: string };

    return {
      ok: false,
      error: error.message || "No se pudo verificar la llave de acceso. Volvé a iniciar sesión.",
    };
  }

  return { ok: true, data: (await response.json()) as T };
}

export async function beginPlatformPasskey(
  loginAttemptId: string,
  registration?: { mode: "setup" | "enroll"; code: string; label: string },
): Promise<PlatformPasskeyOptions | { error: string }> {
  const parsedAttempt = uuid.safeParse(loginAttemptId);

  if (!parsedAttempt.success) {
    return { error: "El intento de inicio de sesión es inválido o ha expirado." };
  }

  let mode: PlatformPasskeyCeremonyMode = "verify";

  let payload: Record<string, unknown> = { loginAttemptId: parsedAttempt.data };

  if (registration !== undefined) {
    const registrationMode = registration.mode === "enroll" ? "enroll" : "setup";

    const parsed = REGISTRATION_SCHEMAS[registrationMode].safeParse({ code: registration.code, label: registration.label });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Revisá los datos ingresados." };
    }

    mode = registrationMode;
    payload = { loginAttemptId: parsedAttempt.data, ...parsed.data };
  }

  const result = await loginRequest<PlatformPasskeyOptions>(`${CEREMONY_PATHS[mode]}/options`, payload);

  if (!result.ok) {
    return { error: result.error };
  }

  return result.data;
}

export async function finishPlatformPasskey(
  ceremonyId: string,
  credential: unknown,
  mode: PlatformPasskeyCeremonyMode,
  next: unknown,
): Promise<{ error?: string } | void> {
  const parsed = verifySchema.safeParse({ ceremonyId, credential });

  if (!parsed.success) {
    return { error: "La verificación no es válida. Volvé a intentarlo." };
  }

  const path = `${CEREMONY_PATHS[ceremonyModeSchema.parse(mode)]}/verify`;

  const result = await loginRequest<PlatformLoginResult>(path, parsed.data);

  if (!result.ok) {
    return { error: result.error };
  }

  await setPlatformAuthCookies(result.data.tokens);
  redirectToNext(typeof next === "string" ? next : null);
}

export async function beginPlatformPasskeyReauth(target: string): Promise<PlatformPasskeyOptions> {
  const parsed = z
    .union([z.enum(["register", "enroll", "email", "password"]), z.string().regex(/^(revoke|setup-code):[a-fA-F0-9-]{36}$/)])
    .parse(target);

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

  revalidatePath("/admin/account/security");

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

  revalidatePath("/admin/account/security");

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
