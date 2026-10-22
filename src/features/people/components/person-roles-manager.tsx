"use client";

import { useMemo, useState, type ReactElement } from "react";

import { ShieldCheckIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";

import { PersonAssignedRoleCard } from "@features/people/components/person-assigned-role-card";
import { PersonAvailableRoles } from "@features/people/components/person-available-roles";
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

  const availableRoles = roles.filter((role) => !selectedRoleCodeSet.has(role.id));

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
    const preservesProtectedRoles = Array.from(protectedRoleIds).every((roleId) => nextRoleCodes.includes(roleId));

    if (!preservesProtectedRoles) {
      return false;
    }

    const roleChanges = getRoleChanges(initialRoleCodes, nextRoleCodes);

    const requiresExplicitRevocation = roleChanges.revocations.length > 0;

    const canAssign = roleChanges.assignments.length === 0 || canAssignRoles;

    const canRevoke = !requiresExplicitRevocation || canRevokeRoles;

    return canAssign && canRevoke;
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
        <div>
          {selectedRoles.length > 0 ? (
            <div className="divide-y">
              {selectedRoles.map((role) => {
                const isPendingAssignment = !initialRoleCodeSet.has(role.roleId);

                const nextRoleCodes = selectedRoleCodes.filter((currentRoleCode) => currentRoleCode !== role.roleId);

                const isInstitutionalAuthority = role.technicalCode === SystemRoleCode.INSTITUTIONAL_AUTHORITY;

                const isRevokable = !isInstitutionalAuthority || PeopleScope.isAdmin(scope);

                return (
                  <PersonAssignedRoleCard
                    key={role.roleId}
                    role={role}
                    isPendingAssignment={isPendingAssignment}
                    removeRole={removeRole}
                    disabled={disabled}
                    selectedRoleCodes={selectedRoleCodes}
                    canApplyRoleCodes={canApplyRoleCodes}
                    nextRoleCodes={nextRoleCodes}
                    isRevokable={isRevokable}
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
            <p className="text-muted-foreground text-sm">Este usuario no tendrá roles asignados.</p>
          )}
        </div>

        <section aria-label="Roles disponibles" className="flex flex-col gap-3 border-t pt-5">
          <h3 className="text-sm font-medium">Roles disponibles</h3>
          {institutionId ? (
            <PersonRolePicker
              institutionId={institutionId}
              scope={scope}
              selectedRoleIds={selectedRoleCodes}
              initialRoleIds={initialRoleCodeSet}
              disabled={disabled}
              canSelect={(role) => canApplyRoleCodes(getRoleSelection(role.id, role).roleIds)}
              onSelect={(role) => selectRole(role.id, role)}
            />
          ) : (
            <PersonAvailableRoles
              roles={availableRoles}
              initialRoleIds={initialRoleCodeSet}
              disabled={disabled}
              canSelect={(role) => canApplyRoleCodes(getRoleSelection(role.id, role).roleIds)}
              onSelect={(role) => selectRole(role.id, role)}
            />
          )}
        </section>
      </div>
    </section>
  );
}
