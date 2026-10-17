import { isValidUuid } from "@common/utils/action-argument.util";

import { getSelfServiceEnrollmentApiPath } from "@features/guardian-workspace/services/operating-profile.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";

export async function GET(request: Request, { params }: { params: Promise<{ personId: string; segments: string[] }> }): Promise<Response> {
  const { personId, segments } = await params;

  if (!isValidUuid(personId) || !segments.length || segments.some((value) => !/^[-a-zA-Z0-9]+$/.test(value))) {
    return Response.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  const query = new URL(request.url).searchParams;

  let suffix = segments.join("/");

  if (segments.at(-1) === "documents") {
    suffix = segments.slice(0, -1).join("/") + "/attachments/" + (query.has("requirementId") ? "history" : "requirements");
  }

  query.delete("scope");

  try {
    const response = await institutionalApiFetch(`${await getSelfServiceEnrollmentApiPath(personId)}/${suffix}?${query}`, { signal: request.signal });

    const headers = new Headers({ "cache-control": "private, no-store", "x-content-type-options": "nosniff" });

    for (const name of ["content-type", "content-disposition", "content-length"]) {
      const value = response.headers.get(name);

      if (value) {
        headers.set(name, value);
      }
    }

    return new Response(response.body, { status: response.status, headers });
  } catch {
    return Response.json(
      { message: "No se pudieron cargar los datos del perfil." },
      { status: 503, headers: { "cache-control": "private, no-store" } },
    );
  }
}
