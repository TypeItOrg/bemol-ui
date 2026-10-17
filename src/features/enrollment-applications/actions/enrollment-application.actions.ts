"use server";

import { INVALID_ACTION_ARGUMENTS, isValidUuid } from "@common/utils/action-argument.util";

import { ENROLLMENT_MESSAGES } from "@features/enrollment-applications/constants/enrollment-messages.constants";
import {
  startEnrollmentApplicationSchema,
  updateEnrollmentDraftSchema,
} from "@features/enrollment-applications/schemas/enrollment-application.schema";
import { mutateEnrollmentApplication } from "@features/enrollment-applications/services/mutate-enrollment-application.service";
import type { ChangeEnrollmentCareerResult } from "@features/enrollment-applications/types/change-enrollment-career-result.types";
import type { StartEnrollmentApplicationInput } from "@features/enrollment-applications/types/start-enrollment-application-input.types";
import type { UpdateEnrollmentDraftInput } from "@features/enrollment-applications/types/update-enrollment-draft-input.types";
import { getSelfServiceEnrollmentApiPath } from "@features/guardian-workspace/services/operating-profile.service";

export async function startOrGetEnrollmentApplicationAction(
  input: StartEnrollmentApplicationInput,
  personId?: string,
): Promise<ChangeEnrollmentCareerResult> {
  const parsed = startEnrollmentApplicationSchema.safeParse(input);

  if ((personId !== undefined && !isValidUuid(personId)) || !parsed.success) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  return mutateEnrollmentApplication(await getSelfServiceEnrollmentApiPath(personId), "POST", ENROLLMENT_MESSAGES.START_FAILED, parsed.data);
}

export async function updateEnrollmentDraftAction(
  applicationId: string,
  input: UpdateEnrollmentDraftInput,
  personId?: string,
): Promise<ChangeEnrollmentCareerResult> {
  const parsed = updateEnrollmentDraftSchema.safeParse(input);

  if ((personId !== undefined && !isValidUuid(personId)) || !isValidUuid(applicationId) || !parsed.success) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  return mutateEnrollmentApplication(
    `${await getSelfServiceEnrollmentApiPath(personId)}/${applicationId}/draft`,
    "PATCH",
    ENROLLMENT_MESSAGES.DRAFT_SAVE_FAILED,
    parsed.data,
  );
}

export async function submitEnrollmentApplicationAction(applicationId: string, personId?: string): Promise<ChangeEnrollmentCareerResult> {
  if ((personId !== undefined && !isValidUuid(personId)) || !isValidUuid(applicationId)) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  return mutateEnrollmentApplication(
    `${await getSelfServiceEnrollmentApiPath(personId)}/${applicationId}/submit`,
    "POST",
    ENROLLMENT_MESSAGES.SUBMISSION_FAILED,
  );
}

export async function cancelEnrollmentApplicationAction(applicationId: string, personId?: string): Promise<ChangeEnrollmentCareerResult> {
  if ((personId !== undefined && !isValidUuid(personId)) || !isValidUuid(applicationId)) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  return mutateEnrollmentApplication(
    `${await getSelfServiceEnrollmentApiPath(personId)}/${applicationId}/cancel`,
    "POST",
    ENROLLMENT_MESSAGES.CANCEL_APPLICATION_FAILED,
  );
}
