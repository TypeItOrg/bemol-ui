import { queryOptions } from "@tanstack/react-query";

import { parseHttpResponse } from "@common/utils/http-response-error.util";

import type { AccountAccess } from "@features/people/types/account-access.types";
import type { PeopleScope } from "@features/people/utils/people-scope.util";

export function accountAccessQueryOptions(scope: PeopleScope, institutionId: string, personId: string) {
  return queryOptions({
    queryKey: ["account-access", scope, institutionId, personId],
    queryFn: async () =>
      parseHttpResponse<AccountAccess>(
        await fetch(`/api/${scope === "admin" ? "admin" : "institutional"}/institutions/${institutionId}/people/${personId}/access`, {
          cache: "no-store",
        }),
        "No se pudo consultar el acceso.",
      ),
    staleTime: 0,
  });
}
