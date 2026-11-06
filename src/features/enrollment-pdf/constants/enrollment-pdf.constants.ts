import type { EnrollmentPdfSettings } from "@features/enrollment-pdf/types/enrollment-pdf-settings.types";

export const ENROLLMENT_PDF_FIELDS = [
  "title",
  "headerText",
  "introductionText",
  "footerText",
  "showApplicantSignature",
  "showResponsibleSignature",
] as const satisfies readonly (keyof EnrollmentPdfSettings)[];

export const ENROLLMENT_PDF_MESSAGES = {
  fetch: "No se pudo cargar la configuración de la planilla.",
  save: "No se pudo guardar la configuración. Tus cambios se conservan para que puedas reintentar.",
  preview: "No se pudo generar el ejemplo. Tus cambios no se guardaron.",
  download: "No se pudo exportar la solicitud. Podés volver a intentarlo.",
  forbidden: "No tenés permisos para personalizar la planilla de esta institución.",
  invalid: "Revisá los datos de la planilla.",
} as const;
