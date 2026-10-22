"use client";

import { useId, useMemo, useState, type ReactElement } from "react";

import { ShieldCheckIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@common/components/ui/empty";

import { PersonAssignedRoleCard } from "@features/people/components/person-assigned-role-card";
import { PersonRolePicker } from "@features/people/components/person-role-picker";
import type { AssignableRole } from "@features/people/types/assignable-role.types";
import { type PersonRolesManagerProps } from "@features/people/types/person-roles-manager-props.types";
import { SystemRoleCode } from "@features/people/types/system-role-code.types";
import { PeopleScope } from "@features/people/utils/people-scope.util";
import { getRoleChanges } from "@features/people/utils/person-role-rules.util";
import { getSelectedRoles } from "@features/people/utils/selected-person-roles.util";

export function PersonRolesManager({
  institutionId,
  assignments,
  onAssignmentChange,
  disabled = false,
  roles,
  assignedRoles,
  selectedRoleCodes,
  onSelectedRoleCodesChange,
  canAssignRoles,
  canRevokeRoles,
  scope = PeopleScope.ADMIN,
}: PersonRolesManagerProps): ReactElement {
  const pickerId = useId();

  const [additionalRoles, setAdditionalRoles] = useState<AssignableRole[]>([]);

  const initialRoleCodes = useMemo(() => assignedRoles.map((role) => role.roleId), [assignedRoles]);

  const initialRoleCodeSet = useMemo(() => new Set(initialRoleCodes), [initialRoleCodes]);

  const selectedRoleCodeSet = useMemo(() => new Set(selectedRoleCodes), [selectedRoleCodes]);

  const assignedRolesByCode = useMemo(() => new Map(assignedRoles.map((role) => [role.roleId, role])), [assignedRoles]);

  const rolesByCode = useMemo(() => new Map([...roles, ...additionalRoles].map((role) => [role.id, role])), [roles, additionalRoles]);

  const selectedRoles = useMemo(
    () => getSelectedRoles(selectedRoleCodeSet, rolesByCode, assignedRolesByCode),
    [assignedRolesByCode, rolesByCode, selectedRoleCodeSet],
  );

  const selectedOptions = selectedRoles.map(
    (role) =>
      rolesByCode.get(role.roleId) ?? {
        id: role.roleId,
        name: role.displayName,
        technicalCode: role.technicalCode,
      },
  );

  const protectedRoleIds = useMemo(
    () =>
      PeopleScope.isInstitutional(scope)
        ? new Set(assignedRoles.filter((role) => role.technicalCode === SystemRoleCode.INSTITUTIONAL_AUTHORITY).map((role) => role.roleId))
        : new Set<string>(),
    [assignedRoles, scope],
  );

  const applicantRoleId = Array.from(rolesByCode.values()).find((role) => role.technicalCode === SystemRoleCode.APPLICANT)?.id;

  function selectRole(roleId: string, candidate?: AssignableRole): void {
    if (selectedRoleCodeSet.has(roleId)) {
      return;
    }

    const roleSelection = getRoleSelection(roleId, candidate);

    if (!canApplyRoleCodes(roleSelection.roleIds)) {
      return;
    }

    if (candidate) {
      setAdditionalRoles((current) => [...current.filter((role) => role.id !== candidate.id), candidate]);
    }

    onSelectedRoleCodesChange(roleSelection.roleIds);
  }

  function removeRole(roleCode: string): void {
    if (selectedRoleCodes.length <= 1) {
      return;
    }

    const nextRoleCodes = selectedRoleCodes.filter((currentRoleCode) => currentRoleCode !== roleCode);

    if (!canApplyRoleCodes(nextRoleCodes)) {
      return;
    }

    onSelectedRoleCodesChange(nextRoleCodes);
  }

  function canApplyRoleCodes(nextRoleCodes: readonly string[]): boolean {
    return getRoleChangeRestriction(nextRoleCodes) === undefined;
  }

  function getRoleChangeRestriction(nextRoleCodes: readonly string[]): string | undefined {
    const preservesProtectedRoles = Array.from(protectedRoleIds).every((roleId) => nextRoleCodes.includes(roleId));

    if (!preservesProtectedRoles) {
      return "Este rol solo se puede administrar desde la plataforma.";
    }

    const roleChanges = getRoleChanges(initialRoleCodes, nextRoleCodes);

    if (roleChanges.assignments.length > 0 && !canAssignRoles) {
      return "No tenés permiso para agregar roles.";
    }

    if (roleChanges.revocations.length > 0 && !canRevokeRoles) {
      return "No tenés permiso para quitar roles ya asignados.";
    }

    return undefined;
  }

  function getToggleRestriction(role: AssignableRole): string | undefined {
    if (PeopleScope.isInstitutional(scope) && role.technicalCode === SystemRoleCode.INSTITUTIONAL_AUTHORITY) {
      return "Este rol solo se puede administrar desde la plataforma.";
    }

    if (selectedRoleCodeSet.has(role.id)) {
      if (selectedRoleCodes.length <= 1) {
        return "El usuario debe conservar al menos un rol.";
      }

      return getRoleChangeRestriction(selectedRoleCodes.filter((id) => id !== role.id));
    }

    return getRoleChangeRestriction(getRoleSelection(role.id, role).roleIds);
  }

  function getRoleSelection(
    roleId: string,
    selectedRole?: AssignableRole,
  ): {
    roleIds: string[];
  } {
    const candidate = selectedRole ?? rolesByCode.get(roleId);

    const replacesSelectedRoles =
      candidate?.technicalCode === SystemRoleCode.APPLICANT || (applicantRoleId !== undefined && selectedRoleCodeSet.has(applicantRoleId));

    const roleIds = replacesSelectedRoles ? [roleId] : [...selectedRoleCodes, roleId];

    return { roleIds };
  }

  return (
    <section aria-label="Roles institucionales" className="bg-muted/25 rounded-xl border p-4 sm:p-5">
      <header className="mb-6">
        <SectionHeader icon={ShieldCheckIcon} title="Roles institucionales" description="Los cambios de roles se aplican al guardar el usuario." />
      </header>
      <div className="flex min-w-0 flex-col gap-5">
        <div className="grid min-w-0 gap-2">
          <label htmlFor={pickerId} className="text-sm font-medium">
            Roles del usuario
          </label>
          <PersonRolePicker
            id={pickerId}
            institutionId={institutionId}
            scope={scope}
            roles={roles}
            selectedRoles={selectedOptions}
            selectedRoleIds={selectedRoleCodes}
            initialRoleIds={initialRoleCodeSet}
            disabled={disabled}
            canSelect={(role) => getToggleRestriction(role) === undefined}
            getRestriction={getToggleRestriction}
            onSelect={(role) => {
              if (disabled || getToggleRestriction(role)) {
                return;
              }

              if (selectedRoleCodeSet.has(role.id)) {
                removeRole(role.id);
              } else {
                selectRole(role.id, role);
              }
            }}
          />
        </div>

        <section aria-label="Configuración de roles" className="grid min-w-0 gap-3 border-t pt-5">
          <h3 className="text-sm font-medium">Configuración de roles</h3>
          {selectedRoles.length > 0 ? (
            <div className="grid min-w-0 gap-3">
              {selectedRoles.map((role) => {
                const isPendingAssignment = !initialRoleCodeSet.has(role.roleId);

                const isInstitutionalAuthority = role.technicalCode === SystemRoleCode.INSTITUTIONAL_AUTHORITY;

                return (
                  <PersonAssignedRoleCard
                    key={role.roleId}
                    role={role}
                    isPendingAssignment={isPendingAssignment}
                    disabled={disabled}
                    institutionId={institutionId}
                    onAssignmentChange={onAssignmentChange}
                    assignments={assignments}
                    rolesByCode={rolesByCode}
                    scope={scope}
                    assignedRolesByCode={assignedRolesByCode}
                    canAssignRoles={canAssignRoles}
                    canRevokeRoles={canRevokeRoles}
                    isInstitutionalAuthority={isInstitutionalAuthority}
                  />
                );
              })}
            </div>
          ) : (
            <Empty className="bg-background rounded-xl border border-solid py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldCheckIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>Sin roles seleccionados</EmptyTitle>
                <EmptyDescription>Seleccioná al menos un rol para configurar su alcance.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>
      </div>
    </section>
  );
}
