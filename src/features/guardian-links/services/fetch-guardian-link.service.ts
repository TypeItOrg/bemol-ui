import "server-only";

import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { parseHttpResponse } from "@common/utils/http-response-error.util";

import {
  GUARDIAN_LINK_MESSAGES,
  getGuardianLinksApiPath,
  getPlatformGuardianLinksApiPath,
} from "@features/guardian-links/constants/guardian-link.constants";
import type { GuardianLinkAttachment } from "@features/guardian-links/types/guardian-link-attachment.types";
import type { GuardianLinkRequest } from "@features/guardian-links/types/guardian-link-request.types";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

export async function fetchGuardianLink(linkId: string, institutionId?: string): Promise<GuardianLinkRequest | null> {
  const apiFetch = institutionId ? institutionalApiFetch : platformApiFetch;

  const path = institutionId ? getGuardianLinksApiPath(institutionId) : getPlatformGuardianLinksApiPath();

  // shortcut: the API has no GET by ID; replace this paginated lookup when that endpoint exists.
  let page = 0;

  let totalPages = 1;

  while (page < totalPages) {
    const data = await parseHttpResponse<PaginatedResponse<Omit<GuardianLinkRequest, "attachments">>>(
      await apiFetch(`${path}/page?page=${page}&size=50`),
      GUARDIAN_LINK_MESSAGES.FETCH,
    );

    const request = data.items.find((item) => item.personGuardianId === linkId);

    if (request) {
      const attachmentPath = institutionId ? `${path}/${linkId}/attachments` : `${path}/${request.institution?.institutionId}/${linkId}/attachments`;

      const attachments = await parseHttpResponse<GuardianLinkAttachment[]>(await apiFetch(attachmentPath), GUARDIAN_LINK_MESSAGES.FETCH_ATTACHMENTS);

      return { ...request, attachments };
    }

    totalPages = data.totalPages;
    page += 1;
  }

  return null;
}
