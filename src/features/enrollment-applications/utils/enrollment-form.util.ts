import type { EnrollmentFormDefinition } from "@features/enrollment-forms/types/enrollment-form-definition.types";
import type { EnrollmentFormNativeBlock } from "@features/enrollment-forms/types/enrollment-form-native-block.types";
import type { EnrollmentFormQuestion } from "@features/enrollment-forms/types/enrollment-form-question.types";

export const ENROLLMENT_NATIVE_TABS: Record<EnrollmentFormNativeBlock, string> = {
  PERSONAL_DATA: "personal",
  SCHOOLING: "education",
  HEALTH_INCLUSION: "health",
  RESPONSIBLE: "responsible",
  ACADEMIC_SELECTION: "spaces",
  PREFERENCES: "preferences",
  PREFERRED_SHIFT: "preferences",
  DOCUMENTATION: "documents",
};

export function hasEnrollmentBlock(definition: EnrollmentFormDefinition | null | undefined, block: EnrollmentFormNativeBlock): boolean {
  return definition ? definition.sections.some((section) => section.nativeBlock === block) : block !== "PREFERRED_SHIFT";
}

export function customAnswerFieldId(questionId: string, prefix = "enrollment-answer"): string {
  return `${prefix}-${questionId}`;
}

export function formatEnrollmentAnswer(question: EnrollmentFormQuestion, value: unknown): string {
  if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
    return "Sin informar";
  }

  if (question.type === "BOOLEAN") {
    if (typeof value !== "boolean") {
      return "Sin informar";
    }

    return value ? "Sí" : "No";
  }

  if (question.type === "SINGLE_CHOICE") {
    return question.options.find((option) => option.id === value)?.label ?? "Sin informar";
  }

  if (question.type === "MULTIPLE_CHOICE") {
    return Array.isArray(value)
      ? value
          .map((id) => question.options.find((option) => option.id === id)?.label)
          .filter(Boolean)
          .join(", ") || "Sin informar"
      : "Sin informar";
  }

  if (question.type === "DATE" && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value.split("-").reverse().join("/");
  }

  return typeof value === "string" || typeof value === "number" ? String(value) : "Sin informar";
}
