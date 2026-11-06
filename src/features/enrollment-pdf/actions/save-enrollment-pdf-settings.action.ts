"use server";

import { revalidatePath } from "next/cache";

import { INVALID_ACTION_ARGUMENTS, isValidUuid } from "@common/utils/action-argument.util";
import { getResponseErrorActionState, getValidationActionState } from "@common/utils/action-state.util";

import { ENROLLMENT_PDF_FIELDS, ENROLLMENT_PDF_MESSAGES } from "@features/enrollment-pdf/constants/enrollment-pdf.constants";
import { enrollmentPdfScopeSchema, parseEnrollmentPdfSettingsForm } from "@features/enrollment-pdf/schemas/enrollment-pdf-settings.schema";
import type { EnrollmentPdfActionState } from "@features/enrollment-pdf/types/enrollment-pdf-action-state.types";
import type { EnrollmentPdfScope } from "@features/enrollment-pdf/types/enrollment-pdf-scope.types";
import { getEnrollmentPdfSettingsApiPath } from "@features/enrollment-pdf/utils/enrollment-pdf-path.util";
import { getInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import { hasInstitutionalPermission } from "@features/institutional-auth/utils/institutional-permission.util";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

export async function saveEnrollmentPdfSettingsAction(
  scope: EnrollmentPdfScope,
  institutionId: string,
  _previous: EnrollmentPdfActionState,
  form: FormData,
): Promise<EnrollmentPdfActionState> {
  if (!enrollmentPdfScopeSchema.safeParse(scope).success || !isValidUuid(institutionId)) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  const parsed = parseEnrollmentPdfSettingsForm(form);

  if (!parsed.success) {
    return getValidationActionState(parsed.error.issues, ENROLLMENT_PDF_FIELDS);
  }

  if (scope === "institutional") {
    const user = await getInstitutionalUser();

    if (!user || user.institutionId !== institutionId || !hasInstitutionalPermission(user, INSTITUTIONAL_PERMISSION.INSTITUTION_UPDATE)) {
      return { error: ENROLLMENT_PDF_MESSAGES.forbidden };
    }
  }

  const fetcher = scope === "platform" ? platformApiFetch : institutionalApiFetch;

  const error = await getResponseErrorActionState(
    fetcher(getEnrollmentPdfSettingsApiPath(scope, institutionId), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    }),
    ENROLLMENT_PDF_FIELDS,
    ENROLLMENT_PDF_MESSAGES.save,
  );

  if (error) {
    return error;
  }

  revalidatePath("/institution/enrollment-pdf");
  revalidatePath(`/admin/institutions/${institutionId}/enrollment-pdf`);

  return { success: true };
}
