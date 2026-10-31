import type { QueryParamValue } from "@common/types/query-param.types";
import { getQueryParamValue, parseOptionalBooleanQueryParam } from "@common/utils/query-param.util";
import { parseSortQuery, serializeSpringSort, type Sort, type SortSearchParams } from "@common/utils/sort-query.util";

import type { Passkey } from "@features/institutional-auth/types/passkey.types";

export const PASSKEY_SORT_FIELDS = ["label", "createdAt", "lastUsedAt"] as const satisfies readonly (keyof Passkey)[];

export type PasskeySortField = (typeof PASSKEY_SORT_FIELDS)[number];

export type PasskeySort = Sort<PasskeySortField>;

export const DEFAULT_PASSKEY_SORT = {
  field: "createdAt",
  direction: "asc",
} as const satisfies PasskeySort;

const passkeySortFields = new Set<PasskeySortField>(PASSKEY_SORT_FIELDS);

export type PasskeySearchParams = SortSearchParams & {
  search?: QueryParamValue;
  used?: QueryParamValue;
};

export type PasskeyFilterParams = {
  search: string;
  used: boolean | undefined;
  sort: PasskeySort;
};

export function parsePasskeyFilterParams(searchParams: PasskeySearchParams = {}): PasskeyFilterParams {
  const rawSearch = getQueryParamValue(searchParams.search);

  return {
    search: rawSearch?.trim() ?? "",
    used: parseOptionalBooleanQueryParam(searchParams.used),
    sort: parseSortQuery(searchParams, passkeySortFields, DEFAULT_PASSKEY_SORT),
  };
}

export function buildPasskeyQueryString(params?: PasskeyFilterParams): string {
  if (!params) {
    return "";
  }

  const searchParams = new URLSearchParams();

  if (params.search.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.used !== undefined) {
    searchParams.set("used", String(params.used));
  }

  searchParams.set("sort", serializeSpringSort(params.sort));

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}
