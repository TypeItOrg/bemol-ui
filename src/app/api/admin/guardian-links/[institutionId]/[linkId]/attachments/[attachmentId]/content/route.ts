import { streamPresignedDownload } from "@common/services/presigned-download.service";
import { isValidUuid } from "@common/utils/action-argument.util";

import { GUARDIAN_LINK_MESSAGES, getPlatformGuardianLinksApiPath } from "@features/guardian-links/constants/guardian-link.constants";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ institutionId: string; linkId: string; attachmentId: string }> },
): Promise<Response> {
  const { institutionId, linkId, attachmentId } = await params;

  if (!isValidUuid(institutionId) || !isValidUuid(linkId) || !isValidUuid(attachmentId)) {
    return Response.json({ message: GUARDIAN_LINK_MESSAGES.DOWNLOAD_FAILED }, { status: 400 });
  }

  try {
    const response = await platformApiFetch(`${getPlatformGuardianLinksApiPath()}/${institutionId}/${linkId}/attachments/${attachmentId}/content`, {
      signal: request.signal,
    });

    if (!response.ok) {
      return new Response(await response.text(), {
        status: response.status,
        headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
      });
    }

    return await streamPresignedDownload(response, request.signal);
  } catch {
    return Response.json({ message: GUARDIAN_LINK_MESSAGES.DOWNLOAD_FAILED }, { status: 503 });
  }
}
