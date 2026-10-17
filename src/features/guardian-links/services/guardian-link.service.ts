import "server-only";

import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { parseHttpResponse } from "@common/utils/http-response-error.util";

import { GUARDIAN_LINK_MESSAGES, getGuardianLinksApiPath } from "@features/guardian-links/constants/guardian-link.constants";
import type { GuardianLinkAttachment } from "@features/guardian-links/types/guardian-link-attachment.types";
import type { GuardianLinkRequest } from "@features/guardian-links/types/guardian-link-request.types";
import type { GuardianLinksQuery } from "@features/guardian-links/types/guardian-links-query.types";
import { buildGuardianLinksSearchParams } from "@features/guardian-links/utils/guardian-links-query.util";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";

type GuardianLinkSummary = Omit<GuardianLinkRequest, "attachments">;

export async function fetchGuardianLinkRequestsPage(
  institutionId: string,
  query: GuardianLinksQuery,
): Promise<PaginatedResponse<GuardianLinkRequest>> {
  const params = buildGuardianLinksSearchParams(query);

  const data = await parseHttpResponse<PaginatedResponse<GuardianLinkSummary>>(
    await institutionalApiFetch(`${getGuardianLinksApiPath(institutionId)}/page?${params.toString()}`),
    GUARDIAN_LINK_MESSAGES.FETCH,
  );

  const items = await Promise.all(
    data.items.map(async (link) => ({
      ...link,
      attachments: await parseHttpResponse<GuardianLinkAttachment[]>(
        await institutionalApiFetch(`${getGuardianLinksApiPath(institutionId)}/${link.personGuardianId}/attachments`),
        GUARDIAN_LINK_MESSAGES.FETCH_ATTACHMENTS,
      ),
    })),
  );

  return { ...data, items };
}
