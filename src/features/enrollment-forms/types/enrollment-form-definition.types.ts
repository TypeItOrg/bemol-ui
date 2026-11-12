import type { EnrollmentFormPdfSection } from "@features/enrollment-forms/types/enrollment-form-pdf-section.types";
import type { EnrollmentFormSection } from "@features/enrollment-forms/types/enrollment-form-section.types";

export type EnrollmentFormDefinition = { sections: EnrollmentFormSection[]; pdfSections: EnrollmentFormPdfSection[] };
