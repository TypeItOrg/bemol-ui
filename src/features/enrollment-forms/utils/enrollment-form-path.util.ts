import type { EnrollmentFormScope } from "@features/enrollment-forms/types/enrollment-form-scope.types";

export function enrollmentFormApiBase(scope: EnrollmentFormScope, institutionId: string): string {
  return `/api/v1/${scope === "platform" ? "admin/" : ""}institutions/${institutionId}`;
}

export function enrollmentFormClientBase(scope: EnrollmentFormScope, institutionId: string): string {
  return `/api/${scope === "platform" ? "admin" : "institutional"}/institutions/${institutionId}`;
}
