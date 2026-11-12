import type { EnrollmentFormNativeBlock } from "@features/enrollment-forms/types/enrollment-form-native-block.types";
import type { EnrollmentFormQuestionType } from "@features/enrollment-forms/types/enrollment-form-question-type.types";

export const ENROLLMENT_NATIVE_LABELS: Record<EnrollmentFormNativeBlock, string> = {
  PERSONAL_DATA: "Datos personales",
  RESPONSIBLE: "Responsable",
  ACADEMIC_SELECTION: "Selección académica",
  DOCUMENTATION: "Documentación",
  SCHOOLING: "Escolaridad",
  HEALTH_INCLUSION: "Salud e inclusión",
  PREFERENCES: "Preferencias",
  PREFERRED_SHIFT: "Turno preferido",
};
export const ENROLLMENT_QUESTION_LABELS: Record<EnrollmentFormQuestionType, string> = {
  SHORT_TEXT: "Texto corto",
  LONG_TEXT: "Texto largo",
  NUMBER: "Número",
  DATE: "Fecha",
  BOOLEAN: "Sí o no",
  SINGLE_CHOICE: "Una opción",
  MULTIPLE_CHOICE: "Varias opciones",
};
export const ENROLLMENT_CORE_BLOCKS: readonly EnrollmentFormNativeBlock[] = ["PERSONAL_DATA", "RESPONSIBLE", "ACADEMIC_SELECTION", "DOCUMENTATION"];
export const ENROLLMENT_VERSION_LABELS = { DRAFT: "Borrador", PUBLISHED: "Publicada", ARCHIVED: "Archivada" } as const;
export const ENROLLMENT_FORMS_ERROR = "No se pudo completar la operación. Volvé a intentar.";
export const ENROLLMENT_FORMS_FORBIDDEN = "No tenés permisos para administrar estos formularios.";
