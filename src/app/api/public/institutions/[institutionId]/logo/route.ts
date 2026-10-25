import { fetchInstitutionLogo } from "@features/institutions/services/fetch-institution-logo.service";

export async function GET(request: Request, { params }: { params: Promise<{ institutionId: string }> }): Promise<Response> {
  const { institutionId } = await params;

  return fetchInstitutionLogo(institutionId, new URL(request.url).searchParams.get("v"));
}
