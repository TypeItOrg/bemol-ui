import type { EnrollmentApplicationResponse } from "@features/enrollment-applications/types/enrollment-application-response.types";

export function getEnrollmentStatusDescription(application: EnrollmentApplicationResponse): string | null {
  switch (application.status) {
    case "PROVISIONALLY_APPROVED":
      return "Podés continuar con tu incorporación y completar aquí la documentación pendiente.";
    case "SUBMITTED":
      return "La institución está revisando los datos y la documentación presentada. Te contactará si necesita algo más.";
    case "REJECTED":
      return application.rejectionReason?.trim() || "Contactá a la institución para obtener más información.";
    case "CANCELLED":
      return "Esta solicitud ya no puede editarse ni ser evaluada.";
    default:
      return null;
  }
}
