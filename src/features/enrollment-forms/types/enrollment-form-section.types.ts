import type { EnrollmentFormNativeBlock } from "@features/enrollment-forms/types/enrollment-form-native-block.types";
import type { EnrollmentFormQuestion } from "@features/enrollment-forms/types/enrollment-form-question.types";

export type EnrollmentFormSection = {
  id: string;
  title: string;
  nativeBlock: EnrollmentFormNativeBlock | null;
  questions: EnrollmentFormQuestion[];
  replacedNativeBlock?: EnrollmentFormNativeBlock | null;
};
