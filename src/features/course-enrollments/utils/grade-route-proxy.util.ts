import "server-only";

import { isValidUuid } from "@common/utils/action-argument.util";
import { createPassthroughResponse } from "@common/utils/create-passthrough-response.util";

import { getInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";

const NO_STORE_HEADERS = { "cache-control": "private, no-store" } as const;

type GradeRouteProxyOptions = {
  uuids?: readonly string[];
  allowPaginationQuery?: boolean;
};

export async function proxyInstitutionalGradeGet(
  request: Request,
  buildPath: (institutionId: string) => string,
  options: GradeRouteProxyOptions = {},
): Promise<Response> {
  if (options.uuids?.some((value) => !isValidUuid(value))) {
    return Response.json({ message: "Los parámetros solicitados no son válidos." }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const user = await getInstitutionalUser();

  if (!user) {
    return Response.json({ message: "La sesión expiró. Iniciá sesión nuevamente." }, { status: 401, headers: NO_STORE_HEADERS });
  }

  let backendPath = buildPath(user.institutionId);

  if (options.allowPaginationQuery) {
    const incoming = new URL(request.url).searchParams;

    const allowed = new URLSearchParams();

    for (const key of ["page", "size"]) {
      const value = incoming.get(key);

      if (value !== null && /^\d+$/.test(value)) {
        allowed.set(key, value);
      }
    }

    const query = allowed.toString();

    if (query) {
      backendPath = `${backendPath}?${query}`;
    }
  }

  try {
    const response = await institutionalApiFetch(backendPath, {
      signal: request.signal,
    });

    return createPassthroughResponse(response);
  } catch {
    return Response.json(
      { message: "El servicio de calificaciones no está disponible. Intentá nuevamente." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}
