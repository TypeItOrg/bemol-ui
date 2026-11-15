"use server";

import { revalidatePath } from "next/cache";

import { INVALID_ACTION_ARGUMENTS, isValidUuid } from "@common/utils/action-argument.util";
import { getResponseErrorActionState } from "@common/utils/action-state.util";

import { RECENT_AUTH_REQUIRED } from "@features/institutional-auth/constants/passkey.constants";
import { readBackendErrorCode } from "@features/institutional-auth/utils/backend-error-code.util";
import { PLATFORM_ACCOUNT_ERROR_MESSAGES } from "@features/platform-accounts/constants/error-messages.constants";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";
import type { PlatformTemporaryCodeState } from "@features/platform-auth/types/platform-temporary-code-state.types";

const PLATFORM_ACCOUNTS_PATH = "/admin/accounts";

export async function issuePlatformAccountSetupCodeAction(id: string): Promise<PlatformTemporaryCodeState> {
  if (!isValidUuid(id)) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  let response: Response;

  try {
    response = await platformApiFetch(`/api/v1/admin/accounts/${id}/passkey-setup-code`, {
      method: "POST",
    });
  } catch {
    return { error: PLATFORM_ACCOUNT_ERROR_MESSAGES.ISSUE_SETUP_CODE };
  }

  if (!response.ok && (await readBackendErrorCode(response.clone())) === RECENT_AUTH_REQUIRED) {
    return { requiresReauth: true };
  }

  const errorState = await getResponseErrorActionState(response, [], PLATFORM_ACCOUNT_ERROR_MESSAGES.ISSUE_SETUP_CODE);

  if (errorState) {
    return errorState;
  }

  const issued = (await response.json()) as {
    code: string;
    expiresAt: string;
    recovery: boolean;
  };

  revalidatePath(`${PLATFORM_ACCOUNTS_PATH}/${id}`);

  return { code: issued.code, expiresAt: issued.expiresAt, recovery: issued.recovery };
}

export async function cancelPlatformAccountSetupCodeAction(id: string): Promise<PlatformTemporaryCodeState> {
  if (!isValidUuid(id)) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  const errorState = await getResponseErrorActionState(
    platformApiFetch(`/api/v1/admin/accounts/${id}/passkey-setup-code`, {
      method: "DELETE",
    }),
    [],
    PLATFORM_ACCOUNT_ERROR_MESSAGES.CANCEL_SETUP_CODE,
  );

  if (errorState) {
    return errorState;
  }

  revalidatePath(`${PLATFORM_ACCOUNTS_PATH}/${id}`);

  return { cancelled: true };
}
