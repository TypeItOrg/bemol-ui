import { streamPresignedDownload } from "@common/services/presigned-download.service";
import { isValidUuid } from "@common/utils/action-argument.util";

import { getSelfServiceEnrollmentApiPath } from "@features/guardian-workspace/services/operating-profile.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ personId: string; applicationId: string; attachmentId: string }> },
): Promise<Response> {
  const { personId, applicationId, attachmentId } = await params;

  if (!isValidUuid(personId) || !isValidUuid(applicationId) || !isValidUuid(attachmentId)) {
    return Response.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  try {
    const response = await institutionalApiFetch(
      `${await getSelfServiceEnrollmentApiPath(personId)}/${applicationId}/attachments/${attachmentId}/content`,
      { signal: request.signal },
    );

    if (!response.ok) {
      return new Response(response.body, {
        status: response.status,
        headers: { "content-type": response.headers.get("content-type") ?? "application/json", "cache-control": "private, no-store" },
      });
    }

    return await streamPresignedDownload(response, request.signal);
  } catch {
    return Response.json({ message: "No se pudo descargar el archivo." }, { status: 503, headers: { "cache-control": "private, no-store" } });
  }
}
