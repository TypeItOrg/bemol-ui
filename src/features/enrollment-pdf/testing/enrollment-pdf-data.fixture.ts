import type { EnrollmentPdfData } from "@features/enrollment-pdf/types/enrollment-pdf-data.types";

export const enrollmentPdfDataFixture: EnrollmentPdfData = {
  institutionId: "22222222-2222-4222-8222-222222222222",
  institution: { name: "Conservatorio", address: "San Martín 100, Villa María", phone: "Sin informar", email: "secretaria@example.com" },
  generatedAt: "2026-11-05T12:00:00Z",
  submittedAt: "2026-11-04T15:30:00.123456Z",
  settings: {
    title: "Solicitud de inscripción",
    headerText: null,
    introductionText: null,
    footerText: null,
    showApplicantSignature: true,
    showResponsibleSignature: true,
  },
  sections: [
    {
      title: "Estudiante",
      fields: [
        { label: "Apellido y nombre", value: "García, Ana" },
        { label: "Teléfono", value: "Sin informar" },
      ],
      allowPageBreaks: false,
    },
  ],
  selections: [{ name: "Piano", level: "Nivel 1", instrument: "Piano", studyPlan: "Plan 2026", status: "Solicitada" }],
  coursesSelected: false,
  hasResponsible: false,
  logoUrl: "/api/v1/institutions/22222222-2222-4222-8222-222222222222/logo?v=1",
};
