"use server";

import { revalidatePath } from "next/cache";

import { getErrorMessage } from "@common/utils/error-message.util";

import { RECENT_AUTH_REQUIRED } from "@features/institutional-auth/constants/passkey.constants";
import { platformPasskeyRequest } from "@features/platform-auth/services/platform-passkeys.service";
import type { PlatformTemporaryCodeState } from "@features/platform-auth/types/platform-temporary-code-state.types";

const OPERATION_FAILED = "No se pudo completar la operación.";

export async function issuePlatformPasskeyEnrollmentCodeAction(): Promise<PlatformTemporaryCodeState> {
  try {
    const issued = await platformPasskeyRequest<{ code: string; expiresAt: string }>("/enrollment-code", "POST");

    revalidatePath("/admin/account/security");

    return { code: issued.code, expiresAt: issued.expiresAt };
  } catch (error) {
    if (error instanceof Error && error.message === RECENT_AUTH_REQUIRED) {
      return { requiresReauth: true };
    }

    return { error: getErrorMessage(error, OPERATION_FAILED) };
  }
}

export async function cancelPlatformPasskeyEnrollmentCodeAction(): Promise<PlatformTemporaryCodeState> {
  try {
    await platformPasskeyRequest("/enrollment-code", "DELETE");

    revalidatePath("/admin/account/security");

    return { cancelled: true };
  } catch (error) {
    return { error: getErrorMessage(error, OPERATION_FAILED) };
  }
}
