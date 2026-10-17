import type { AsyncDropdownFetchPageInput } from "@common/types/async-dropdown-fetch-page-input.types";
import type { AsyncDropdownPage } from "@common/types/async-dropdown-page.types";
import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { parseHttpResponse } from "@common/utils/http-response-error.util";
import { buildPaginationSearchParams } from "@common/utils/pagination-query.util";
import { toAsyncDropdownPage } from "@common/utils/to-async-dropdown-page.util";

import type { AuditActorKind } from "@features/platform-audit/types/audit-actor-kind.types";
import type { AuditActorOption } from "@features/platform-audit/types/audit-actor-option.types";

export async function fetchAuditActorOptions(
  { page, search, signal, size }: AsyncDropdownFetchPageInput,
  kind?: AuditActorKind,
  institutionId?: string,
): Promise<AsyncDropdownPage<AuditActorOption>> {
  const params = buildPaginationSearchParams({ page, size, search });

  if (kind && kind !== "ANONYMOUS") {
    params.set("actorKind", kind);
  }

  if (institutionId) {
    params.set("institutionId", institutionId);
  }

  const response = await fetch(`/api/admin/audit-events/actors?${params}`, { signal });

  const data = await parseHttpResponse<PaginatedResponse<AuditActorOption>>(response, "No se pudieron cargar los actores.");

  return toAsyncDropdownPage(data);
}
