import type { EnrollmentFormOption } from "@features/enrollment-forms/types/enrollment-form-option.types";
import type { EnrollmentFormQuestionType } from "@features/enrollment-forms/types/enrollment-form-question-type.types";

export type EnrollmentFormQuestion = {
  id: string;
  label: string;
  help: string | null;
  type: EnrollmentFormQuestionType;
  required: boolean;
  options: EnrollmentFormOption[];
};
