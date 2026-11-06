import { previewEnrollmentPdf } from "@features/enrollment-pdf/services/enrollment-pdf-proxy.service";

export async function POST(request: Request, { params }: { params: Promise<{ institutionId: string }> }): Promise<Response> {
  const { institutionId } = await params;

  return previewEnrollmentPdf(request, "platform", institutionId);
}
