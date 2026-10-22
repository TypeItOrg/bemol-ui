"use client";

import { useCallback } from "react";

import { AsyncDropdown } from "@common/components/ui/async-dropdown";
import type { AsyncDropdownFetchPageInput } from "@common/types/async-dropdown-fetch-page-input.types";
import type { AsyncDropdownPage } from "@common/types/async-dropdown-page.types";

import { ROLE_OPTIONS_MESSAGES as M } from "@features/people/constants/role-options.constants";
import { fetchRoleOptions } from "@features/people/services/fetch-role-options.service";
import type { AssignableRole } from "@features/people/types/assignable-role.types";
import { SystemRoleCode } from "@features/people/types/system-role-code.types";
import { PeopleScope, type PeopleScope as PeopleScopeType } from "@features/people/utils/people-scope.util";

type Props = {
  id?: string;
  institutionId?: string;
  scope: PeopleScopeType;
  roles?: readonly AssignableRole[];
  selectedRoles?: readonly AssignableRole[];
  selectedRoleIds: readonly string[];
  initialRoleIds: ReadonlySet<string>;
  disabled: boolean;
  canSelect: (role: AssignableRole) => boolean;
  getRestriction?: (role: AssignableRole) => string | undefined;
  onSelect: (role: AssignableRole) => void;
};

export function PersonRolePicker({
  id,
  institutionId,
  scope,
  roles = [],
  selectedRoles = [],
  selectedRoleIds,
  initialRoleIds,
  disabled,
  canSelect,
  getRestriction,
  onSelect,
}: Props) {
  const fetchPage = useCallback(
    async (input: AsyncDropdownFetchPageInput) => {
      const matchesSearch = (role: AssignableRole) => role.name.toLocaleLowerCase().includes(input.search.trim().toLocaleLowerCase());

      const isVisible = (role: AssignableRole) =>
        PeopleScope.isAdmin(scope) || role.technicalCode !== SystemRoleCode.INSTITUTIONAL_AUTHORITY || selectedRoleIds.includes(role.id);

      let catalog: AsyncDropdownPage<AssignableRole>;

      if (institutionId) {
        catalog = await fetchRoleOptions(institutionId, scope, input);
      } else {
        const filtered = roles.filter(isVisible).filter(matchesSearch);

        const start = input.page * input.size;

        catalog = { items: filtered.slice(start, start + input.size), nextPage: start + input.size < filtered.length ? input.page + 1 : null };
      }

      const pinned = input.page === 0 ? selectedRoles.filter(matchesSearch) : [];

      const items = Array.from(new Map([...pinned, ...catalog.items].filter(isVisible).map((role) => [role.id, role])).values());

      return { items, nextPage: catalog.nextPage };
    },
    [institutionId, roles, scope, selectedRoleIds, selectedRoles],
  );

  function describeRole(role: AssignableRole): string | undefined {
    const restriction = getRestriction?.(role);

    if (restriction) {
      return restriction;
    }

    if (role.technicalCode === SystemRoleCode.APPLICANT) {
      return "No se combina con otros roles; al seleccionarlo reemplaza los demás.";
    }

    if (selectedRoleIds.includes(role.id) && !initialRoleIds.has(role.id)) {
      return "Se agregará al guardar.";
    }

    if (!selectedRoleIds.includes(role.id) && initialRoleIds.has(role.id)) {
      return "Se guardará sin este rol.";
    }

    return undefined;
  }

  return (
    <AsyncDropdown<AssignableRole>
      id={id}
      fetchPage={fetchPage}
      queryKey={["assignable-role-picker", institutionId ?? "local", scope, Array.from(initialRoleIds).sort(), institutionId ? null : roles]}
      getItemValue={(role) => role.id}
      getItemLabel={(role) => role.name}
      getItemDescription={describeRole}
      getItemDisabled={(role) => !canSelect(role)}
      selectedValues={selectedRoleIds}
      selectedLabel={
        selectedRoleIds.length > 0
          ? `${selectedRoleIds.length} ${selectedRoleIds.length === 1 ? "rol seleccionado" : "roles seleccionados"}`
          : undefined
      }
      placeholder="Seleccionar roles"
      searchPlaceholder={M.SEARCH}
      emptyMessage={M.EMPTY}
      errorMessage={M.LOAD_ERROR}
      disabled={disabled}
      closeOnSelect={false}
      estimateSize={56}
      aria-required
      onValueChange={(_id, role) => {
        if (role && !disabled && canSelect(role)) {
          onSelect(role);
        }
      }}
    />
  );
}
