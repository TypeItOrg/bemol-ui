import "server-only";

import { isValidUuid } from "@common/utils/action-argument.util";
import { buildPaginationSearchParams, parsePaginationQuery } from "@common/utils/pagination-query.util";

import { ENROLLMENT_FORMS_ERROR, ENROLLMENT_FORMS_FORBIDDEN } from "@features/enrollment-forms/constants/enrollment-form.constants";
import { enrollmentFormDefinitionSchema } from "@features/enrollment-forms/schemas/enrollment-form-definition.schema";
import { enrollmentFormAccess } from "@features/enrollment-forms/services/enrollment-form-access.service";
import type { EnrollmentFormScope } from "@features/enrollment-forms/types/enrollment-form-scope.types";
import { enrollmentFormApiBase } from "@features/enrollment-forms/utils/enrollment-form-path.util";
import { proxyEnrollmentPdf } from "@features/enrollment-pdf/services/enrollment-pdf-proxy.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

export async function readEnrollmentForms(
  request: Request,
  scope: EnrollmentFormScope,
  institutionId: string,
  resource: "enrollment-forms" | "enrollment-form-assignments",
  segments: string[] = [],
): Promise<Response> {
  const validPath =
    resource === "enrollment-form-assignments"
      ? segments.length === 0
      : segments.length === 0 ||
        (segments.length === 1 && (segments[0] === "base" || isValidUuid(segments[0]))) ||
        ((segments.length === 2 || segments.length === 3) &&
          isValidUuid(segments[0]) &&
          segments[1] === "versions" &&
          (segments.length === 2 || isValidUuid(segments[2])));

  if (!isValidUuid(institutionId) || !validPath) {
    return Response.json({ message: "La dirección del formulario no es válida." }, { status: 400 });
  }

  const denied = await enrollmentFormAccess(scope, institutionId, false);

  if (denied) {
    return Response.json({ message: ENROLLMENT_FORMS_FORBIDDEN }, { status: denied });
  }

  const url = new URL(request.url);

  const { page, size, search } = parsePaginationQuery({
    page: url.searchParams.get("page") ?? undefined,
    size: url.searchParams.get("size") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
  });

  if (search.length > 150) {
    return Response.json({ message: "La búsqueda no puede superar los 150 caracteres." }, { status: 400 });
  }

  const query = buildPaginationSearchParams({ page, size, search });

  const year = url.searchParams.get("academicYearId");

  if (year) {
    if (!isValidUuid(year)) {
      return Response.json({ message: "El ciclo lectivo no es válido." }, { status: 400 });
    }

    query.set("academicYearId", year);
  }

  try {
    const fetcher = scope === "platform" ? platformApiFetch : institutionalApiFetch;

    const response = await fetcher(
      `${enrollmentFormApiBase(scope, institutionId)}/${resource}${segments.length ? `/${segments.join("/")}` : ""}?${query}`,
      { signal: request.signal },
    );

    return new Response(response.body, {
      status: response.status,
      headers: { "content-type": "application/json", "cache-control": "private, no-store" },
    });
  } catch {
    return Response.json({ message: ENROLLMENT_FORMS_ERROR }, { status: 503 });
  }
}

export async function previewEnrollmentFormPdf(request: Request, scope: EnrollmentFormScope, institutionId: string): Promise<Response> {
  if (!isValidUuid(institutionId)) {
    return Response.json({ message: "La institución no es válida." }, { status: 400 });
  }

  const denied = await enrollmentFormAccess(scope, institutionId, true);

  if (denied) {
    return Response.json({ message: ENROLLMENT_FORMS_FORBIDDEN }, { status: denied });
  }

  const parsed = enrollmentFormDefinitionSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json({ message: parsed.error.issues[0]?.message ?? "Revisá la definición del formulario." }, { status: 400 });
  }

  return proxyEnrollmentPdf(request, scope, `${enrollmentFormApiBase(scope, institutionId)}/enrollment-forms/preview-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  });
}
