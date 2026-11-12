import type { EnrollmentFormDefinition } from "@features/enrollment-forms/types/enrollment-form-definition.types";
import type { EnrollmentFormVersionSummary } from "@features/enrollment-forms/types/enrollment-form-version-summary.types";

export type EnrollmentFormVersion = EnrollmentFormVersionSummary & { definition: EnrollmentFormDefinition };
