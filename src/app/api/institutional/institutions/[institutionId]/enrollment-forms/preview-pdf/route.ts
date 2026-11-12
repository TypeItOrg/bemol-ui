import { previewEnrollmentFormPdf } from "@features/enrollment-forms/services/enrollment-form-proxy.service";

export async function POST(request: Request, { params }: { params: Promise<{ institutionId: string }> }): Promise<Response> {
  const { institutionId } = await params;

  return previewEnrollmentFormPdf(request, "institutional", institutionId);
}
