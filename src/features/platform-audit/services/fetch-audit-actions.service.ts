import type { AsyncDropdownFetchPageInput } from "@common/types/async-dropdown-fetch-page-input.types";
import type { AsyncDropdownPage } from "@common/types/async-dropdown-page.types";
import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { parseHttpResponse } from "@common/utils/http-response-error.util";
import { buildPaginationSearchParams } from "@common/utils/pagination-query.util";
import { toAsyncDropdownPage } from "@common/utils/to-async-dropdown-page.util";

import type { AuditActionOption } from "@features/platform-audit/types/audit-action-option.types";
import type { AuditModule } from "@features/platform-audit/types/audit-module.types";

export async function fetchAuditActionOptions(
  { page, search, signal, size }: AsyncDropdownFetchPageInput,
  module?: AuditModule,
): Promise<AsyncDropdownPage<AuditActionOption>> {
  const params = buildPaginationSearchParams({ page, size, search });

  if (module) {
    params.set("module", module);
  }

  const response = await fetch(`/api/admin/audit-events/actions?${params}`, { signal });

  const data = await parseHttpResponse<PaginatedResponse<AuditActionOption>>(response, "No se pudieron cargar las acciones.");

  return toAsyncDropdownPage(data);
}
