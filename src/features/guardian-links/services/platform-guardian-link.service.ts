import "server-only";

import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { parseHttpResponse } from "@common/utils/http-response-error.util";

import { GUARDIAN_LINK_MESSAGES, getPlatformGuardianLinksApiPath } from "@features/guardian-links/constants/guardian-link.constants";
import type { GuardianLinkAttachment } from "@features/guardian-links/types/guardian-link-attachment.types";
import type { GuardianLinkRequest } from "@features/guardian-links/types/guardian-link-request.types";
import type { GuardianLinksQuery } from "@features/guardian-links/types/guardian-links-query.types";
import { buildGuardianLinksSearchParams } from "@features/guardian-links/utils/guardian-links-query.util";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

export async function fetchPlatformGuardianLinkRequestsPage(query: GuardianLinksQuery): Promise<PaginatedResponse<GuardianLinkRequest>> {
  const params = buildGuardianLinksSearchParams(query);

  const data = await parseHttpResponse<PaginatedResponse<Omit<GuardianLinkRequest, "attachments">>>(
    await platformApiFetch(`${getPlatformGuardianLinksApiPath()}/page?${params.toString()}`),
    GUARDIAN_LINK_MESSAGES.FETCH,
  );

  const items = await Promise.all(
    data.items.map(async (request) => ({
      ...request,
      attachments: await parseHttpResponse<GuardianLinkAttachment[]>(
        await platformApiFetch(`${getPlatformGuardianLinksApiPath()}/${request.institution?.institutionId}/${request.personGuardianId}/attachments`),
        GUARDIAN_LINK_MESSAGES.FETCH_ATTACHMENTS,
      ),
    })),
  );

  return { ...data, items };
}
