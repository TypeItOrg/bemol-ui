import type { AsyncDropdownFetchPageInput } from "@common/types/async-dropdown-fetch-page-input.types";
import type { AsyncDropdownPage } from "@common/types/async-dropdown-page.types";
import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { HttpResponseError, parseHttpResponse } from "@common/utils/http-response-error.util";
import { buildPaginationSearchParams } from "@common/utils/pagination-query.util";
import { toAsyncDropdownPage } from "@common/utils/to-async-dropdown-page.util";

import { mutateEnrollmentFormAction } from "@features/enrollment-forms/actions/mutate-enrollment-form.action";
import { ENROLLMENT_FORMS_ERROR } from "@features/enrollment-forms/constants/enrollment-form.constants";
import type { EnrollmentFormCommand } from "@features/enrollment-forms/types/enrollment-form-command.types";
import type { EnrollmentFormModel } from "@features/enrollment-forms/types/enrollment-form-model.types";
import type { EnrollmentFormScope } from "@features/enrollment-forms/types/enrollment-form-scope.types";
import type { EnrollmentFormVersionSummary } from "@features/enrollment-forms/types/enrollment-form-version-summary.types";
import { enrollmentFormClientBase } from "@features/enrollment-forms/utils/enrollment-form-path.util";

export async function readEnrollmentFormResource<T>(
  scope: EnrollmentFormScope,
  institutionId: string,
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${enrollmentFormClientBase(scope, institutionId)}/${path}`, { cache: "no-store", signal });

  return parseHttpResponse<T>(response, "No se pudieron cargar los formularios.");
}

export async function fetchEnrollmentFormModelPage(
  scope: EnrollmentFormScope,
  institutionId: string,
  { page, search, signal, size }: AsyncDropdownFetchPageInput,
): Promise<AsyncDropdownPage<EnrollmentFormModel>> {
  const params = buildPaginationSearchParams({ page, search, size });

  const data = await readEnrollmentFormResource<PaginatedResponse<EnrollmentFormModel>>(scope, institutionId, `enrollment-forms?${params}`, signal);

  return toAsyncDropdownPage(data);
}

export async function fetchEnrollmentFormVersionPage(
  scope: EnrollmentFormScope,
  institutionId: string,
  formId: string,
  { page, search, signal, size }: AsyncDropdownFetchPageInput,
): Promise<AsyncDropdownPage<EnrollmentFormVersionSummary>> {
  const params = buildPaginationSearchParams({ page, search, size });

  const data = await readEnrollmentFormResource<PaginatedResponse<EnrollmentFormVersionSummary>>(
    scope,
    institutionId,
    `enrollment-forms/${formId}/versions?${params}`,
    signal,
  );

  return toAsyncDropdownPage(data);
}

export async function runEnrollmentFormCommand<T>(scope: EnrollmentFormScope, institutionId: string, command: EnrollmentFormCommand): Promise<T> {
  const result = await mutateEnrollmentFormAction(scope, institutionId, command);

  if (!result.success) {
    throw new HttpResponseError(result.error || ENROLLMENT_FORMS_ERROR, result.status ?? 503);
  }

  return result.data as T;
}
