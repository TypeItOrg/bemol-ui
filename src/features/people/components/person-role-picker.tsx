"use client";

import { useState } from "react";

import { useInfiniteQuery } from "@tanstack/react-query";

import { Button } from "@common/components/ui/button";
import { Input } from "@common/components/ui/input";
import { useDebouncedValue } from "@common/hooks/use-debounced-value";

import { PersonAvailableRoles } from "@features/people/components/person-available-roles";
import { ROLE_OPTIONS_MESSAGES as M } from "@features/people/constants/role-options.constants";
import { fetchRoleOptions } from "@features/people/services/fetch-role-options.service";
import type { AssignableRole } from "@features/people/types/assignable-role.types";
import { SystemRoleCode } from "@features/people/types/system-role-code.types";
import { PeopleScope, type PeopleScope as PeopleScopeType } from "@features/people/utils/people-scope.util";

type Props = {
  institutionId: string;
  scope: PeopleScopeType;
  selectedRoleIds: readonly string[];
  initialRoleIds: ReadonlySet<string>;
  disabled: boolean;
  canSelect: (role: AssignableRole) => boolean;
  onSelect: (role: AssignableRole) => void;
};

export function PersonRolePicker({ institutionId, scope, selectedRoleIds, initialRoleIds, disabled, canSelect, onSelect }: Props) {
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebouncedValue(search, 250);

  const query = useInfiniteQuery({
    queryKey: ["assignable-role-list", institutionId, scope, debouncedSearch],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => fetchRoleOptions(institutionId, scope, { page: pageParam, size: 50, search: debouncedSearch, signal }),
    getNextPageParam: (page) => page.nextPage ?? undefined,
  });

  const catalogRoles =
    query.data?.pages
      .flatMap((page) => page.items)
      .filter((role) => PeopleScope.isAdmin(scope) || role.technicalCode !== SystemRoleCode.INSTITUTIONAL_AUTHORITY) ?? [];

  const roles = catalogRoles.filter((role) => !selectedRoleIds.includes(role.id));

  const showSearch = search.length > 0 || query.hasNextPage || (query.data?.pages.length ?? 0) > 1;

  return (
    <div className="grid gap-3" aria-busy={query.isFetching}>
      {showSearch ? (
        <Input aria-label={M.SEARCH_LABEL} placeholder={M.SEARCH} value={search} onChange={(event) => setSearch(event.target.value)} />
      ) : null}
      {query.isPending ? (
        <p className="text-muted-foreground text-sm" role="status">
          {M.LOADING}
        </p>
      ) : null}
      {query.data ? (
        <PersonAvailableRoles
          roles={roles}
          initialRoleIds={initialRoleIds}
          disabled={disabled || search !== debouncedSearch}
          canSelect={canSelect}
          onSelect={(role) => {
            if (!disabled && !selectedRoleIds.includes(role.id) && canSelect(role)) {
              onSelect(role);
            }
          }}
          emptyMessage={catalogRoles.length > 0 ? M.ALL_ASSIGNED : M.EMPTY}
        />
      ) : null}
      {query.isError ? (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-destructive text-sm">
            {M.LOAD_ERROR}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => (query.isFetchNextPageError ? query.fetchNextPage() : query.refetch())}>
            {M.RETRY}
          </Button>
        </div>
      ) : null}
      {query.hasNextPage && !query.isError ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-self-start"
          disabled={query.isFetchingNextPage}
          onClick={() => query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? M.LOADING : M.MORE}
        </Button>
      ) : null}
    </div>
  );
}
