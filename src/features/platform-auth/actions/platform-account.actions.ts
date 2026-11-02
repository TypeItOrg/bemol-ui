"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getResponseErrorActionState, getValidationActionState } from "@common/utils/action-state.util";

import {
  platformEmailSchema,
  platformEmailTokenSchema,
  platformPasswordSchema,
  platformProfileSchema,
} from "@features/platform-auth/schemas/platform-account.schema";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";
import type { PlatformSelfAccountActionState } from "@features/platform-auth/types/platform-self-account-action-state.types";
import { clearPlatformAuthCookies } from "@features/platform-auth/utils/platform-auth-cookies.util";
import { PLATFORM_LOGIN_PATH } from "@features/platform-auth/utils/platform-auth-proxy-policy.util";

const FIELDS = ["name", "lastName", "email", "currentPassword", "password", "confirmPassword"] as const;

async function changeAccount(path: string, body: unknown, method = "POST"): Promise<PlatformSelfAccountActionState> {
  const response = platformApiFetch(`/api/v1/admin/auth/account/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return (await getResponseErrorActionState(response, FIELDS, "No se pudo actualizar tu cuenta. Intentá nuevamente.")) ?? { success: true };
}

export async function updateOwnPlatformProfileAction(
  _previous: PlatformSelfAccountActionState,
  formData: FormData,
): Promise<PlatformSelfAccountActionState> {
  const parsed = platformProfileSchema.safeParse({ name: formData.get("name"), lastName: formData.get("lastName") });

  if (!parsed.success) {
    return getValidationActionState(parsed.error.issues, FIELDS);
  }

  const result = await changeAccount("profile", parsed.data, "PUT");

  if (result.success) {
    revalidatePath("/admin/account", "layout");
    revalidatePath("/admin/accounts");
  }

  return result;
}

export async function requestOwnPlatformEmailChangeAction(
  _previous: PlatformSelfAccountActionState,
  formData: FormData,
): Promise<PlatformSelfAccountActionState> {
  const parsed = platformEmailSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return getValidationActionState(parsed.error.issues, FIELDS);
  }

  return changeAccount("email-changes", parsed.data);
}

export async function changeOwnPlatformPasswordAction(
  _previous: PlatformSelfAccountActionState,
  formData: FormData,
): Promise<PlatformSelfAccountActionState> {
  const parsed = platformPasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return getValidationActionState(parsed.error.issues, FIELDS);
  }

  const result = await changeAccount("password", parsed.data);

  if (!result.success) {
    return result;
  }

  await clearPlatformAuthCookies();
  redirect(`${PLATFORM_LOGIN_PATH}?accountUpdated=1`);
}

export async function confirmOwnPlatformEmailAction(
  _previous: PlatformSelfAccountActionState,
  formData: FormData,
): Promise<PlatformSelfAccountActionState> {
  const parsed = platformEmailTokenSchema.safeParse({ token: formData.get("token") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const result = await changeAccount("email-changes/confirm", parsed.data);

  if (!result.success) {
    return result;
  }

  await clearPlatformAuthCookies();
  redirect(`${PLATFORM_LOGIN_PATH}?accountUpdated=1`);
}
