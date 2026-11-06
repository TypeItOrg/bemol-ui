import "server-only";

import { parseHttpResponse } from "@common/utils/http-response-error.util";

import { ENROLLMENT_PDF_MESSAGES } from "@features/enrollment-pdf/constants/enrollment-pdf.constants";
import type { EnrollmentPdfScope } from "@features/enrollment-pdf/types/enrollment-pdf-scope.types";
import type { EnrollmentPdfSettings } from "@features/enrollment-pdf/types/enrollment-pdf-settings.types";
import { getEnrollmentPdfSettingsApiPath } from "@features/enrollment-pdf/utils/enrollment-pdf-path.util";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

export async function fetchEnrollmentPdfSettings(scope: EnrollmentPdfScope, institutionId: string): Promise<EnrollmentPdfSettings> {
  const fetcher = scope === "platform" ? platformApiFetch : institutionalApiFetch;

  const response = await fetcher(getEnrollmentPdfSettingsApiPath(scope, institutionId));

  return parseHttpResponse(response, ENROLLMENT_PDF_MESSAGES.fetch);
}
