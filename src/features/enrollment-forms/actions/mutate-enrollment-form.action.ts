"use server";

import { revalidatePath } from "next/cache";

import { isValidUuid, INVALID_ACTION_ARGUMENTS } from "@common/utils/action-argument.util";
import { getResponseErrorActionState } from "@common/utils/action-state.util";

import { ENROLLMENT_FORMS_ERROR, ENROLLMENT_FORMS_FORBIDDEN } from "@features/enrollment-forms/constants/enrollment-form.constants";
import { enrollmentFormCommandSchema, enrollmentFormScopeSchema } from "@features/enrollment-forms/schemas/enrollment-form-command.schema";
import { enrollmentFormAccess } from "@features/enrollment-forms/services/enrollment-form-access.service";
import type { EnrollmentFormActionState } from "@features/enrollment-forms/types/enrollment-form-action-state.types";
import type { EnrollmentFormScope } from "@features/enrollment-forms/types/enrollment-form-scope.types";
import { enrollmentFormApiBase } from "@features/enrollment-forms/utils/enrollment-form-path.util";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

export async function mutateEnrollmentFormAction(
  scope: EnrollmentFormScope,
  institutionId: string,
  input: unknown,
): Promise<EnrollmentFormActionState> {
  const parsed = enrollmentFormCommandSchema.safeParse(input);

  if (!enrollmentFormScopeSchema.safeParse(scope).success || !isValidUuid(institutionId) || !parsed.success) {
    return { error: parsed.success ? INVALID_ACTION_ARGUMENTS : parsed.error.issues[0]?.message || INVALID_ACTION_ARGUMENTS, status: 400 };
  }

  const denied = await enrollmentFormAccess(scope, institutionId, true);

  if (denied) {
    return { error: ENROLLMENT_FORMS_FORBIDDEN, status: denied };
  }

  const command = parsed.data;

  const base = enrollmentFormApiBase(scope, institutionId);

  let path: string;

  let method = "POST";

  let body: unknown;

  switch (command.kind) {
    case "create":
      path = `${base}/enrollment-forms`;
      body = { name: command.name };
      break;
    case "rename":
      path = `${base}/enrollment-forms/${command.formId}`;
      method = "PUT";
      body = { name: command.name, expectedRevision: command.expectedRevision };
      break;
    case "draft":
      path = `${base}/enrollment-forms/${command.formId}/versions`;
      body = { sourceVersionId: command.sourceVersionId };
      break;
    case "save":
      path = `${base}/enrollment-forms/${command.formId}/versions/${command.versionId}`;
      method = "PUT";
      body = { definition: command.definition, expectedRevision: command.expectedRevision };
      break;
    case "publish":
    case "archive":
      path = `${base}/enrollment-forms/${command.formId}/versions/${command.versionId}/${command.kind}`;
      body = { expectedRevision: command.expectedRevision };
      break;
    case "assign":
      path = `${base}/enrollment-form-assignments`;
      body = { trainingPathId: command.trainingPathId, academicYearId: command.academicYearId, formVersionId: command.formVersionId };
      break;
    case "reassign":
      path = `${base}/enrollment-form-assignments/${command.assignmentId}`;
      method = "PUT";
      body = { formVersionId: command.formVersionId, expectedRevision: command.expectedRevision };
      break;
    case "unassign":
      path = `${base}/enrollment-form-assignments/${command.assignmentId}?expectedRevision=${command.expectedRevision}`;
      method = "DELETE";
      break;
  }

  const fetcher = scope === "platform" ? platformApiFetch : institutionalApiFetch;

  let response: Response | undefined;

  const pending = fetcher(path, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  }).then((value) => {
    response = value;

    return value;
  });

  const error = await getResponseErrorActionState(pending, [], ENROLLMENT_FORMS_ERROR);

  if (error) {
    return { error: error.error || ENROLLMENT_FORMS_ERROR, status: response?.status };
  }

  const resolved = await pending;

  const data: unknown = resolved.status === 204 ? undefined : await resolved.json();

  revalidatePath("/institution/enrollment-forms");
  revalidatePath(`/admin/institutions/${institutionId}/enrollment-forms`);

  return { success: true, data };
}
