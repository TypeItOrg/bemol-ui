"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { INVALID_ACTION_ARGUMENTS, isValidUuid } from "@common/utils/action-argument.util";
import { getResponseErrorActionState } from "@common/utils/action-state.util";

import {
  GUARDIAN_DEPENDENT_MESSAGES,
  GUARDIAN_DEPENDENTS_PAGE_PATH,
  getGuardianDependentsApiPath,
} from "@features/guardian-dependents/constants/guardian-dependent.constants";
import type { GuardianDependentActionState } from "@features/guardian-dependents/types/guardian-dependent-action-state.types";
import { GUARDIAN_DEPENDENT_FIELD_NAMES } from "@features/guardian-dependents/types/guardian-dependent-field-name.types";
import { authorizeGuardianAction } from "@features/guardian-dependents/utils/authorize-guardian-action.util";
import { guardianDocumentFileSchema } from "@features/guardian-dependents/utils/guardian-dependent-documents.util";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";

const confirmationSchema = guardianDocumentFileSchema.extend({ storageKey: z.string().min(1).max(1024) });

export async function confirmGuardianDependentDocumentAction(
  institutionId: string,
  personGuardianId: string,
  upload: unknown,
): Promise<GuardianDependentActionState> {
  const document = confirmationSchema.safeParse(upload);

  if (!isValidUuid(institutionId) || !isValidUuid(personGuardianId) || !document.success) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  const authError = await authorizeGuardianAction(institutionId);

  if (authError) {
    return authError;
  }

  const request = institutionalApiFetch(`${getGuardianDependentsApiPath(institutionId)}/${personGuardianId}/attachments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(document.data),
  });

  const errorState = await getResponseErrorActionState(request, GUARDIAN_DEPENDENT_FIELD_NAMES, GUARDIAN_DEPENDENT_MESSAGES.ATTACHMENTS_FAILED);

  if (errorState) {
    return errorState;
  }

  revalidatePath(GUARDIAN_DEPENDENTS_PAGE_PATH);

  return { success: true };
}
