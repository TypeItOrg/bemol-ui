import { readEnrollmentForms } from "@features/enrollment-forms/services/enrollment-form-proxy.service";

export async function GET(request: Request, { params }: { params: Promise<{ institutionId: string; segments?: string[] }> }): Promise<Response> {
  const { institutionId, segments } = await params;

  return readEnrollmentForms(request, "institutional", institutionId, "enrollment-form-assignments", segments);
}
