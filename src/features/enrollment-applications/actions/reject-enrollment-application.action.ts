"use server";

import { INVALID_ACTION_ARGUMENTS, isValidUuid } from "@common/utils/action-argument.util";
import { getResponseErrorActionState, getValidationActionState } from "@common/utils/action-state.util";

import { authorizeAcademicAction } from "@features/academic/utils/academic-action-auth.util";
import { AcademicScope } from "@features/academic/utils/academic-scope.util";
import { ENROLLMENT_MESSAGES } from "@features/enrollment-applications/constants/enrollment-messages.constants";
import { rejectionReasonSchema } from "@features/enrollment-applications/schemas/rejection-reason.schema";
import type { EnrollmentApplicationRejectActionState } from "@features/enrollment-applications/types/enrollment-application-reject-action-state.types";
import type { EnrollmentApplicationRejectField } from "@features/enrollment-applications/types/enrollment-application-reject-field.types";
import { revalidateEnrollmentApplicationViews } from "@features/enrollment-applications/utils/revalidate-enrollment-application-views.util";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";

const REJECT_FIELDS: readonly EnrollmentApplicationRejectField[] = ["rejectionReason"];

export async function rejectEnrollmentApplicationAction(
  institutionId: string,
  applicationId: string,
  _state: EnrollmentApplicationRejectActionState,
  formData: FormData,
): Promise<EnrollmentApplicationRejectActionState> {
  if (!isValidUuid(institutionId) || !isValidUuid(applicationId) || !(formData instanceof FormData)) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  const parsed = rejectionReasonSchema.safeParse({
    rejectionReason: formData.get("rejectionReason"),
  });

  if (!parsed.success) {
    return getValidationActionState(parsed.error.issues, REJECT_FIELDS);
  }

  const authError = await authorizeAcademicAction(AcademicScope.INSTITUTIONAL, institutionId, INSTITUTIONAL_PERMISSION.ENROLLMENT_APPLICATION_REJECT);

  if (authError) {
    return { error: authError.error };
  }

  const errorState = await getResponseErrorActionState(
    institutionalApiFetch(`/api/v1/institutions/${institutionId}/enrollment-applications/${applicationId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejectionReason: parsed.data.rejectionReason }),
    }),
    REJECT_FIELDS,
    ENROLLMENT_MESSAGES.REJECT,
  );

  if (errorState) {
    return errorState;
  }

  revalidateEnrollmentApplicationViews(applicationId, { institutionId });

  return { success: true };
}
