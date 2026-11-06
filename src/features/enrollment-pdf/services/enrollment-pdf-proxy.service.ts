import "server-only";

import { isValidUuid } from "@common/utils/action-argument.util";

import { ENROLLMENT_PDF_MESSAGES } from "@features/enrollment-pdf/constants/enrollment-pdf.constants";
import { enrollmentPdfSettingsSchema } from "@features/enrollment-pdf/schemas/enrollment-pdf-settings.schema";
import type { EnrollmentPdfScope } from "@features/enrollment-pdf/types/enrollment-pdf-scope.types";
import { getEnrollmentPdfSettingsApiPath } from "@features/enrollment-pdf/utils/enrollment-pdf-path.util";
import { getInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import { hasInstitutionalPermission } from "@features/institutional-auth/utils/institutional-permission.util";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

export async function proxyEnrollmentPdf(request: Request, scope: EnrollmentPdfScope, path: string, init: RequestInit = {}): Promise<Response> {
  try {
    const fetcher = scope === "platform" ? platformApiFetch : institutionalApiFetch;

    const outgoing = new Headers(init.headers);

    outgoing.set("Accept", "application/pdf, application/json");

    const response = await fetcher(path, { ...init, headers: outgoing, signal: request.signal });

    const headers = new Headers({ "cache-control": "private, no-store", "x-content-type-options": "nosniff" });

    for (const name of ["content-type", "content-disposition", "content-length", "retry-after", "x-request-id"]) {
      const value = response.headers.get(name);

      if (value) {
        headers.set(name, value);
      }
    }

    return new Response(response.body, { status: response.status, headers });
  } catch {
    return Response.json({ message: ENROLLMENT_PDF_MESSAGES.download }, { status: 503, headers: { "cache-control": "private, no-store" } });
  }
}

export async function previewEnrollmentPdf(request: Request, scope: EnrollmentPdfScope, institutionId: string): Promise<Response> {
  if (!isValidUuid(institutionId)) {
    return Response.json({ message: ENROLLMENT_PDF_MESSAGES.invalid }, { status: 400 });
  }

  if (scope === "institutional") {
    const user = await getInstitutionalUser();

    if (!user || user.institutionId !== institutionId || !hasInstitutionalPermission(user, INSTITUTIONAL_PERMISSION.INSTITUTION_UPDATE)) {
      return Response.json({ message: ENROLLMENT_PDF_MESSAGES.forbidden }, { status: 403 });
    }
  }

  const parsed = enrollmentPdfSettingsSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json({ message: ENROLLMENT_PDF_MESSAGES.invalid }, { status: 400 });
  }

  return proxyEnrollmentPdf(request, scope, `${getEnrollmentPdfSettingsApiPath(scope, institutionId)}/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  });
}
