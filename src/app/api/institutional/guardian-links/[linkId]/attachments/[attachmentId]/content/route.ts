import { streamPresignedDownload } from "@common/services/presigned-download.service";
import { isValidUuid } from "@common/utils/action-argument.util";

import { GUARDIAN_LINK_MESSAGES, getGuardianLinksApiPath } from "@features/guardian-links/constants/guardian-link.constants";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";

/** Resolves the presigned download through the session, since the API needs the institutional credentials. */
export async function GET(request: Request, { params }: { params: Promise<{ linkId: string; attachmentId: string }> }): Promise<Response> {
  const { linkId, attachmentId } = await params;

  if (!isValidUuid(linkId) || !isValidUuid(attachmentId)) {
    return Response.json({ message: GUARDIAN_LINK_MESSAGES.DOWNLOAD_FAILED }, { status: 400 });
  }

  try {
    const user = await requireInstitutionalUser();

    const response = await institutionalApiFetch(`${getGuardianLinksApiPath(user.institutionId)}/${linkId}/attachments/${attachmentId}/content`, {
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
