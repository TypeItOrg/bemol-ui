import type { EnrollmentPdfScope } from "@features/enrollment-pdf/types/enrollment-pdf-scope.types";

export function getEnrollmentPdfSettingsApiPath(scope: EnrollmentPdfScope, institutionId: string): string {
  const prefix = scope === "platform" ? "/api/v1/admin/institutions" : "/api/v1/institutions";

  return `${prefix}/${institutionId}/enrollment-pdf-settings`;
}
