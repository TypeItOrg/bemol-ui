import type { AsyncDropdownFetchPageInput } from "@common/types/async-dropdown-fetch-page-input.types";
import type { AsyncDropdownPage } from "@common/types/async-dropdown-page.types";
import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { parseHttpResponse } from "@common/utils/http-response-error.util";

import { ROLE_OPTIONS_MESSAGES as M } from "@features/people/constants/role-options.constants";
import type { AssignableRole } from "@features/people/types/assignable-role.types";
import { PeopleScope, type PeopleScope as PeopleScopeType } from "@features/people/utils/people-scope.util";

export async function fetchRoleOptions(
  institutionId: string,
  scope: PeopleScopeType,
  { page, size, search, signal }: AsyncDropdownFetchPageInput,
): Promise<AsyncDropdownPage<AssignableRole>> {
  const params = new URLSearchParams({ institutionId, page: String(page), size: String(size), search });

  const session = PeopleScope.isInstitutional(scope) ? "institutional" : "admin";

  const response = await fetch(`/api/${session}/role-options?${params}`, { signal, cache: "no-store" });

  const data = await parseHttpResponse<PaginatedResponse<AssignableRole>>(response, M.LOAD_ERROR);

  return { items: data.items, nextPage: data.page + 1 < data.totalPages ? data.page + 1 : null };
}
