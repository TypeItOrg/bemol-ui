import type { QueryParamValue } from "@common/types/query-param.types";
import { buildPaginationSearchParams, parsePaginationQuery } from "@common/utils/pagination-query.util";
import { getQueryParamValue } from "@common/utils/query-param.util";

import { GUARDIAN_LINK_STATUS } from "@features/guardian-dependents/types/guardian-link-status.types";
import type { GuardianLinksQuery } from "@features/guardian-links/types/guardian-links-query.types";

export function parseGuardianLinksQuery(params: Record<string, QueryParamValue>): GuardianLinksQuery {
  const pagination = parsePaginationQuery(params);

  const documentation = getQueryParamValue(params.hasDocumentation);

  return {
    ...pagination,
    search: pagination.search.slice(0, 100),
    status: Object.values(GUARDIAN_LINK_STATUS).find((value) => value === getQueryParamValue(params.status)),
    hasDocumentation: documentation === "true" || documentation === "false" ? documentation === "true" : undefined,
  };
}

export function buildGuardianLinksSearchParams(query: GuardianLinksQuery): URLSearchParams {
  const params = buildPaginationSearchParams(query);

  if (query.status) {
    params.set("status", query.status);
  }

  if (query.hasDocumentation !== undefined) {
    params.set("hasDocumentation", String(query.hasDocumentation));
  }

  return params;
}
