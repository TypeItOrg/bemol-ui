"use client";

import { useCallback, useId, type ReactElement } from "react";

import { AsyncDropdown } from "@common/components/ui/async-dropdown";
import { DataTableFilters, type DataTableSelectFilter } from "@common/components/ui/data-table-filters";
import { useDataTableNavigation } from "@common/components/ui/data-table-navigation";
import type { AsyncDropdownFetchPageInput } from "@common/types/async-dropdown-fetch-page-input.types";

import { ROLE_OPTIONS_MESSAGES as M } from "@features/people/constants/role-options.constants";
import { fetchRoleOptions } from "@features/people/services/fetch-role-options.service";
import type { AssignableRole } from "@features/people/types/assignable-role.types";
import { PeopleScope, type PeopleScope as PeopleScopeType } from "@features/people/utils/people-scope.util";

const ALL_ROLES = "all";

type PeopleSearchFormProps = {
  search: string;
  size: number;
  roleId?: string;
  roles?: AssignableRole[];
  institutionId?: string;
  scope?: PeopleScopeType;
};

export function PeopleSearchForm({
  search,
  size,
  roleId,
  roles = [],
  institutionId,
  scope = PeopleScope.ADMIN,
}: PeopleSearchFormProps): ReactElement {
  const filterId = useId();

  const { navigate } = useDataTableNavigation();

  const fetchRoles = useCallback((input: AsyncDropdownFetchPageInput) => fetchRoleOptions(institutionId!, scope, input), [institutionId, scope]);

  const roleFilter: DataTableSelectFilter = {
    defaultValue: ALL_ROLES,
    label: "Rol",
    name: "roleId",
    options: [{ value: ALL_ROLES, label: "Todos los roles" }, ...roles.map((role) => ({ value: role.id, label: role.name }))],
    value: roleId ?? ALL_ROLES,
  };

  return (
    <DataTableFilters
      search={search}
      searchPlaceholder="Buscar por nombre, apellido o documento..."
      selectFilters={institutionId ? [] : [roleFilter]}
      size={size}
    >
      {institutionId ? (
        <div className="grid min-w-0 gap-1.5">
          <label htmlFor={filterId} className="text-sm font-medium">
            Rol
          </label>
          <AsyncDropdown<AssignableRole>
            id={filterId}
            fetchPage={fetchRoles}
            queryKey={["role-filter-options", institutionId, scope]}
            getItemValue={(role) => role.id}
            getItemLabel={(role) => role.name}
            defaultOption={{ value: ALL_ROLES, label: "Todos los roles" }}
            selectedLabel={roles.find((role) => role.id === roleId)?.name}
            value={roleId ?? ALL_ROLES}
            searchPlaceholder={M.SEARCH}
            emptyMessage={M.EMPTY}
            errorMessage={M.LOAD_ERROR}
            onValueChange={(id) => navigate({ roleId: id === ALL_ROLES ? undefined : id, page: "0", size: String(size) }, { replace: true })}
          />
        </div>
      ) : null}
    </DataTableFilters>
  );
}
