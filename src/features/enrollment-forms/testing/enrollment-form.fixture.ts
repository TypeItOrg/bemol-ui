import type { EnrollmentFormDefinition } from "@features/enrollment-forms/types/enrollment-form-definition.types";
import type { EnrollmentFormVersion } from "@features/enrollment-forms/types/enrollment-form-version.types";

export const formTestId = (value: number): string => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

export function formDefinitionFixture(): EnrollmentFormDefinition {
  return {
    sections: [
      { id: formTestId(1), title: "Persona", nativeBlock: "PERSONAL_DATA", questions: [] },
      { id: formTestId(2), title: "Responsable", nativeBlock: "RESPONSIBLE", questions: [] },
      { id: formTestId(3), title: "Oferta", nativeBlock: "ACADEMIC_SELECTION", questions: [] },
      { id: formTestId(4), title: "Documentación", nativeBlock: "DOCUMENTATION", questions: [] },
      {
        id: formTestId(5),
        title: "Instrumentos",
        nativeBlock: null,
        questions: [{ id: formTestId(6), label: "¿Tenés instrumento?", help: null, type: "BOOLEAN", required: false, options: [] }],
      },
    ],
    pdfSections: [],
  };
}

export function formVersionFixture(): EnrollmentFormVersion {
  return {
    id: formTestId(11),
    formId: formTestId(12),
    institutionId: formTestId(13),
    versionNumber: 1,
    status: "DRAFT",
    revision: 3,
    publishedAt: null,
    archivedAt: null,
    definition: formDefinitionFixture(),
  };
}
