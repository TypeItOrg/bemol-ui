import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { parseHttpResponse } from "@common/utils/http-response-error.util";
import { PAGE_SIZE_OPTIONS } from "@common/utils/pagination-query.util";

import { PEOPLE_ERROR_MESSAGES } from "@features/people/constants/error-messages.constants";
import { peopleApiFetch } from "@features/people/services/people-api-fetch.service";
import type { AssignableRole } from "@features/people/types/assignable-role.types";
import type { SystemRoleList } from "@features/people/types/system-role-list.types";
import { PeopleScope, type PeopleScope as PeopleScopeType } from "@features/people/utils/people-scope.util";

const ROLE_CATALOG_PAGE_SIZE = PAGE_SIZE_OPTIONS[PAGE_SIZE_OPTIONS.length - 1];

export async function fetchSystemRoles(
  institutionId: string,
  scope: PeopleScopeType = PeopleScope.ADMIN,
  assignedRoleIds: readonly string[] = [],
): Promise<AssignableRole[]> {
  const path = PeopleScope.isInstitutional(scope)
    ? `/api/v1/institutions/${institutionId}/roles`
    : `/api/v1/admin/institutions/${institutionId}/role-options`;

  const response = await peopleApiFetch(scope, `${path}?size=${ROLE_CATALOG_PAGE_SIZE}`);

  const page = await parseHttpResponse<PaginatedResponse<AssignableRole>>(response, PEOPLE_ERROR_MESSAGES.FETCH_ROLES);

  const loadedIds = new Set(page.items.map((role) => role.id));

  const missingIds = [...new Set(assignedRoleIds)].filter((id) => !loadedIds.has(id));

  const optionPath = PeopleScope.isInstitutional(scope) ? `/api/v1/institutions/${institutionId}/role-options` : path;

  const assigned = await Promise.all(
    missingIds.map(async (id) => {
      const detail = await peopleApiFetch(scope, `${optionPath}/${id}`);

      return parseHttpResponse<AssignableRole>(detail, PEOPLE_ERROR_MESSAGES.FETCH_ROLES);
    }),
  );

  return [...page.items, ...assigned];
}

export async function fetchSystemRolesCatalog(): Promise<SystemRoleList> {
  const response = await peopleApiFetch(PeopleScope.ADMIN, "/api/v1/admin/roles/system");

  return parseHttpResponse<SystemRoleList>(response, PEOPLE_ERROR_MESSAGES.FETCH_ROLES);
}
