import type { AsyncDropdownFetchPageInput } from "@common/types/async-dropdown-fetch-page-input.types";
import type { AsyncDropdownPage } from "@common/types/async-dropdown-page.types";
import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { parseHttpResponse } from "@common/utils/http-response-error.util";
import { buildPaginationSearchParams } from "@common/utils/pagination-query.util";
import { toAsyncDropdownPage } from "@common/utils/to-async-dropdown-page.util";

import type { AuditFilters } from "@features/platform-audit/types/audit-filters.types";
import type { AuditPersonOption } from "@features/platform-audit/types/audit-person-option.types";

export async function fetchAuditPersonOptions(
  { page, search, signal, size }: AsyncDropdownFetchPageInput,
  { scope, institutionId }: Pick<AuditFilters, "scope" | "institutionId">,
): Promise<AsyncDropdownPage<AuditPersonOption>> {
  const params = buildPaginationSearchParams({ page, size, search });

  if (scope) {
    params.set("scope", scope);
  }

  if (institutionId) {
    params.set("institutionId", institutionId);
  }

  const response = await fetch(`/api/admin/audit-events/people?${params}`, { signal });

  const data = await parseHttpResponse<PaginatedResponse<AuditPersonOption>>(response, "No se pudieron cargar las personas.");

  return toAsyncDropdownPage(data);
}
