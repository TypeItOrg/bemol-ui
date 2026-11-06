import { isValidUuid } from "@common/utils/action-argument.util";

import { ENROLLMENT_PDF_MESSAGES } from "@features/enrollment-pdf/constants/enrollment-pdf.constants";
import { proxyEnrollmentPdf } from "@features/enrollment-pdf/services/enrollment-pdf-proxy.service";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";

export async function GET(request: Request, { params }: { params: Promise<{ applicationId: string }> }): Promise<Response> {
  const { applicationId } = await params;

  if (!isValidUuid(applicationId)) {
    return Response.json({ message: ENROLLMENT_PDF_MESSAGES.invalid }, { status: 400 });
  }

  const user = await requireInstitutionalUser();

  return proxyEnrollmentPdf(request, "institutional", `/api/v1/institutions/${user.institutionId}/enrollment-applications/${applicationId}/pdf`);
}
