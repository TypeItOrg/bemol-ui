"use server";

import { INVALID_ACTION_ARGUMENTS, isValidUuid } from "@common/utils/action-argument.util";
import { getResponseErrorActionState } from "@common/utils/action-state.util";

import { getInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import { hasInstitutionalPermission } from "@features/institutional-auth/utils/institutional-permission.util";
import { INSTITUTION_ERROR_MESSAGES } from "@features/institutions/constants/error-messages.constants";
import type { InstitutionLogoScope } from "@features/institutions/types/institution-logo-change.types";
import { getInstitutionLogoFileError } from "@features/institutions/utils/institution-logo-form.util";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

export type PresignedInstitutionLogoUpload = {
  version?: string;
  uploadUrl?: string;
  headers?: Record<string, string>;
  error?: string;
};

type PresignedResponse = { version: string; uploadUrl: string; headers: Record<string, string> };

export async function presignInstitutionLogoUploadAction(
  institutionId: string,
  scope: InstitutionLogoScope,
  contentType: string,
  fileSize: number,
): Promise<PresignedInstitutionLogoUpload> {
  if (!isValidUuid(institutionId)) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  const fileError = getInstitutionLogoFileError({ type: contentType, size: fileSize });

  if (fileError) {
    return { error: fileError };
  }

  const response = await requestPresign(institutionId, scope, contentType, fileSize);

  if (!response) {
    return { error: INSTITUTION_ERROR_MESSAGES.LOGO_FORBIDDEN };
  }

  const errorState = await getResponseErrorActionState(response, ["file"], INSTITUTION_ERROR_MESSAGES.LOGO_UPDATE);

  if (errorState) {
    return { error: errorState.fieldErrors?.file ?? errorState.error };
  }

  try {
    const { version, uploadUrl, headers } = (await response.json()) as PresignedResponse;

    return { version, uploadUrl, headers };
  } catch {
    return { error: INSTITUTION_ERROR_MESSAGES.LOGO_UPDATE };
  }
}

async function requestPresign(
  institutionId: string,
  scope: InstitutionLogoScope,
  contentType: string,
  fileSize: number,
): Promise<Response | undefined> {
  const init = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType, fileSize }),
  };

  if (scope === "platform") {
    return platformApiFetch(`/api/v1/admin/institutions/${institutionId}/logo/upload-url`, init);
  }

  const user = await getInstitutionalUser();

  if (!user || user.institutionId !== institutionId || !hasInstitutionalPermission(user, INSTITUTIONAL_PERMISSION.INSTITUTION_UPDATE)) {
    return undefined;
  }

  return institutionalApiFetch(`/api/v1/institutions/${institutionId}/logo/upload-url`, init);
}
