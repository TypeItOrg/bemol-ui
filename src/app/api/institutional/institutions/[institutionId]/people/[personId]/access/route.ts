import { isValidUuid } from "@common/utils/action-argument.util";
import { createPassthroughResponse } from "@common/utils/create-passthrough-response.util";

import { peopleApiFetch } from "@features/people/services/people-api-fetch.service";
import { getPeoplePath } from "@features/people/utils/people-scope.util";

export async function GET(request: Request, { params }: { params: Promise<{ institutionId: string; personId: string }> }): Promise<Response> {
  const { institutionId, personId } = await params;

  if (!isValidUuid(institutionId) || !isValidUuid(personId)) {
    return Response.json({ message: "Identificadores inválidos." }, { status: 400 });
  }

  try {
    return createPassthroughResponse(
      await peopleApiFetch("institutional", `${getPeoplePath("institutional", institutionId, personId)}/access`, { signal: request.signal }),
    );
  } catch {
    return Response.json({ message: "No se pudo consultar el acceso." }, { status: 503 });
  }
}
