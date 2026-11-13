import { streamPresignedDownload } from "@common/services/presigned-download.service";
import { isValidUuid } from "@common/utils/action-argument.util";

import { AcademicScope } from "@features/academic/utils/academic-scope.util";
import { ENROLLMENT_MESSAGES } from "@features/enrollment-applications/constants/enrollment-messages.constants";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

export async function GET(request: Request, { params }: { params: Promise<{ applicationId: string; attachmentId: string }> }): Promise<Response> {
  const { applicationId, attachmentId } = await params;

  const scope = new URL(request.url).searchParams.get("scope") ?? AcademicScope.INSTITUTIONAL;

  if (!isValidUuid(applicationId) || !isValidUuid(attachmentId) || (scope !== AcademicScope.ADMIN && scope !== AcademicScope.INSTITUTIONAL)) {
    return Response.json(
      { message: ENROLLMENT_MESSAGES.DOWNLOAD_INPUT_INVALID },
      {
        status: 400,
        headers: { "cache-control": "private, no-store", "x-content-type-options": "nosniff" },
      },
    );
  }

  try {
    const response = await (AcademicScope.isAdmin(scope) ? platformApiFetch : institutionalApiFetch)(
      `/api/v1/enrollment-applications/${applicationId}/attachments/${attachmentId}/content`,
      {
        signal: request.signal,
      },
    );

    if (!response.ok) {
      const body = await response.text();

      return new Response(body, {
        status: response.status,
        headers: {
          "content-type": response.headers.get("content-type") ?? "application/json",
          "cache-control": "private, no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }

    return await streamPresignedDownload(response, request.signal);
  } catch {
    return Response.json(
      { message: ENROLLMENT_MESSAGES.DOWNLOAD_FAILED },
      {
        status: 503,
        headers: { "cache-control": "private, no-store", "x-content-type-options": "nosniff" },
      },
    );
  }
}
