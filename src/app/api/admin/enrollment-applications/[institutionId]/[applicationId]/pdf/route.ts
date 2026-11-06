import { isValidUuid } from "@common/utils/action-argument.util";

import { ENROLLMENT_PDF_MESSAGES } from "@features/enrollment-pdf/constants/enrollment-pdf.constants";
import { proxyEnrollmentPdf } from "@features/enrollment-pdf/services/enrollment-pdf-proxy.service";

export async function GET(request: Request, { params }: { params: Promise<{ institutionId: string; applicationId: string }> }): Promise<Response> {
  const { institutionId, applicationId } = await params;

  if (!isValidUuid(institutionId) || !isValidUuid(applicationId)) {
    return Response.json({ message: ENROLLMENT_PDF_MESSAGES.invalid }, { status: 400 });
  }

  return proxyEnrollmentPdf(request, "platform", `/api/v1/admin/enrollment-applications/${institutionId}/${applicationId}/pdf`);
}
