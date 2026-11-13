import type { EnrollmentApplicationResponse } from "@features/enrollment-applications/types/enrollment-application-response.types";
import type { EnrollmentFormDefinition } from "@features/enrollment-forms/types/enrollment-form-definition.types";
import type { EnrollmentFormNativeBlock } from "@features/enrollment-forms/types/enrollment-form-native-block.types";
import type { EnrollmentFormQuestion } from "@features/enrollment-forms/types/enrollment-form-question.types";

export const formTestId = (id: number): string => `00000000-0000-4000-8000-${String(id).padStart(12, "0")}`;

export const FORM_QUESTIONS: EnrollmentFormQuestion[] = [
  { id: formTestId(101), label: "Instrumento disponible", help: "Contanos qué instrumento tenés.", type: "SHORT_TEXT", required: true, options: [] },
  { id: formTestId(102), label: "Antecedentes", help: null, type: "LONG_TEXT", required: false, options: [] },
  { id: formTestId(103), label: "Años de práctica", help: null, type: "NUMBER", required: true, options: [] },
  { id: formTestId(104), label: "Fecha de inicio", help: null, type: "DATE", required: true, options: [] },
  { id: formTestId(105), label: "Tiene instrumento", help: null, type: "BOOLEAN", required: true, options: [] },
  {
    id: formTestId(106),
    label: "Modalidad",
    help: null,
    type: "SINGLE_CHOICE",
    required: true,
    options: [
      { id: formTestId(201), label: "Presencial" },
      { id: formTestId(202), label: "Virtual" },
    ],
  },
  {
    id: formTestId(107),
    label: "Disponibilidad",
    help: null,
    type: "MULTIPLE_CHOICE",
    required: true,
    options: [
      { id: formTestId(203), label: "Lunes" },
      { id: formTestId(204), label: "Martes" },
    ],
  },
];

export function configuredForm(questions = FORM_QUESTIONS, optionalBlocks: EnrollmentFormNativeBlock[] = []): EnrollmentFormDefinition {
  const blocks: EnrollmentFormNativeBlock[] = ["PERSONAL_DATA", "RESPONSIBLE", "ACADEMIC_SELECTION", "DOCUMENTATION", ...optionalBlocks];

  const sections = [
    ...blocks.map((nativeBlock, index) => ({ id: formTestId(index + 1), title: nativeBlock, nativeBlock, questions: [] })),
    { id: formTestId(50), title: "Preguntas de la institución", nativeBlock: null, questions },
  ];

  return {
    sections,
    pdfSections: sections.map((section) => ({ sectionId: section.id, questionIds: section.questions.map((question) => question.id) })),
  };
}

export const CONFIGURED_ANSWERS = {
  [formTestId(101)]: "Guitarra",
  [formTestId(102)]: "Participé de un taller.\nMe interesa continuar.",
  [formTestId(103)]: 0,
  [formTestId(104)]: "2026-01-15",
  [formTestId(105)]: false,
  [formTestId(106)]: formTestId(201),
  [formTestId(107)]: [formTestId(204)],
};

export const CONFIGURED_APPLICATION: EnrollmentApplicationResponse = {
  applicationId: formTestId(501),
  institutionId: formTestId(502),
  personId: formTestId(503),
  academicYearId: formTestId(505),
  enrollmentPeriodId: formTestId(506),
  formVersionId: formTestId(507),
  draftRevision: 4,
  formDefinition: configuredForm(),
  status: "DRAFT",
  isEditable: true,
  canReadAttachments: false,
  createdAt: "2026-01-01T10:00:00Z",
  updatedAt: "2026-01-01T10:00:00Z",
  documents: [],
  data: {
    personalData: {
      firstName: "Ana",
      lastName: "Pérez",
      birthDate: "1990-01-01",
      documentNumber: "30111222",
      phoneNumber: "3534112233",
      nationalityCountry: { id: formTestId(508), name: "Argentina", isoCode: "ARG" },
      email: "ana@example.com",
    },
    responsible: {},
    careerSelection: { trainingPathId: formTestId(509) },
    courses: [{ courseId: formTestId(510) }],
    customAnswers: CONFIGURED_ANSWERS,
  },
};
