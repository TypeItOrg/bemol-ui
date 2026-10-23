"use server";

import { validateRequestInstitutionId } from "@common/services/institutional-host/institutional-host.service";
import { getFieldErrors } from "@common/utils/form-field-errors.util";

import { INSTITUTIONAL_AUTH_ERROR_MESSAGES } from "@features/institutional-auth/constants/error-messages.constants";
import { institutionalPasskeyLoginSchema } from "@features/institutional-auth/schemas/institutional-passkey-login.schema";
import { requestDiscoverablePasskeyAuthOptions } from "@features/institutional-auth/services/passkey-auth-options.service";
import type { BeginPasskeyLoginState } from "@features/institutional-auth/types/begin-passkey-login-state.types";
import type { InstitutionalPasskeyLoginInput } from "@features/institutional-auth/types/institutional-passkey-login-input.types";

export async function beginInstitutionalPasskeyLogin(input: InstitutionalPasskeyLoginInput): Promise<BeginPasskeyLoginState> {
  const parsed = institutionalPasskeyLoginSchema.safeParse(input);

  if (!parsed.success) {
    return {
      fieldErrors: getFieldErrors(parsed.error.issues, ["institutionId"]),
    };
  }

  const contextError = await validateRequestInstitutionId(parsed.data.institutionId);

  if (contextError) {
    return { error: contextError };
  }

  const output = await requestDiscoverablePasskeyAuthOptions(parsed.data.institutionId);

  if (!output.success) {
    return { error: output.error.message || INSTITUTIONAL_AUTH_ERROR_MESSAGES.PASSKEY_FAILED };
  }

  return { ceremonyId: output.data.ceremonyId, options: output.data.options };
}
