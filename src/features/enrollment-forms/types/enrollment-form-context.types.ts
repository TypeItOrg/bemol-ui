import type { EnrollmentFormScope } from "@features/enrollment-forms/types/enrollment-form-scope.types";

export type EnrollmentFormContext = { institutionId: string; scope: EnrollmentFormScope; canUpdate: boolean };
