import { createPassthroughResponse } from "@common/utils/create-passthrough-response.util";

import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;

  const allowed = new URLSearchParams();

  for (const name of ["page", "size", "search", "module", "action"]) {
    const value = params.get(name);

    if (value) {
      allowed.set(name, value);
    }
  }

  try {
    const response = await platformApiFetch(`/api/v1/admin/audit-events/actions?${allowed}`, { signal: request.signal });

    return createPassthroughResponse(response);
  } catch {
    return Response.json({ message: "El servicio de acciones no está disponible. Intentá nuevamente." }, { status: 503 });
  }
}
