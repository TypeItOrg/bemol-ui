"use server";

import { z } from "zod";

import type { PresignedUploadResult } from "@common/types/presigned-upload-result.types";
import { INVALID_ACTION_ARGUMENTS, isValidUuid } from "@common/utils/action-argument.util";
import { getResponseErrorActionState } from "@common/utils/action-state.util";
import { presignedUploadSchema } from "@common/utils/presigned-upload.util";

import { GUARDIAN_DEPENDENT_MESSAGES, getGuardianDependentsApiPath } from "@features/guardian-dependents/constants/guardian-dependent.constants";
import { authorizeGuardianAction } from "@features/guardian-dependents/utils/authorize-guardian-action.util";
import { guardianDocumentFileSchema } from "@features/guardian-dependents/utils/guardian-dependent-documents.util";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";

const presignedResponseSchema = presignedUploadSchema.extend({ storageKey: z.string().min(1) });

export async function presignGuardianDependentDocumentAction(
  institutionId: string,
  personGuardianId: string,
  metadata: unknown,
): Promise<PresignedUploadResult<{ storageKey: string }>> {
  const document = guardianDocumentFileSchema.safeParse(metadata);

  if (!isValidUuid(institutionId) || !isValidUuid(personGuardianId) || !document.success) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  const authError = await authorizeGuardianAction(institutionId);

  if (authError) {
    return authError;
  }

  const response = institutionalApiFetch(`${getGuardianDependentsApiPath(institutionId)}/${personGuardianId}/attachments/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(document.data),
  });

  const errorState = await getResponseErrorActionState(response, [], GUARDIAN_DEPENDENT_MESSAGES.ATTACHMENTS_FAILED);

  if (errorState) {
    return { error: errorState.error ?? GUARDIAN_DEPENDENT_MESSAGES.ATTACHMENTS_FAILED };
  }

  try {
    return { upload: presignedResponseSchema.parse(await (await response).json()) };
  } catch {
    return { error: GUARDIAN_DEPENDENT_MESSAGES.ATTACHMENTS_FAILED };
  }
}
