import type { ReactElement } from "react";

import { AuditComparisonTable } from "@features/platform-audit/components/audit-comparison-table";
import { renderAuditHistoryChanges } from "@features/platform-audit/components/audit-history-changes";
import { AuditMailChanges } from "@features/platform-audit/components/audit-mail-changes";
import { auditOperationRows } from "@features/platform-audit/components/audit-operation-changes";
import { AUDIT_ACTION_MODULES } from "@features/platform-audit/constants/audit-labels.constants";
import type { AuditComparisonRow } from "@features/platform-audit/types/audit-comparison-row.types";
import type { AuditEvent } from "@features/platform-audit/types/audit-event.types";

export function renderAuditEventChanges({
  event,
  roleLabels,
  permissionLabels,
}: {
  event: AuditEvent;
  roleLabels: Readonly<Record<string, string>>;
  permissionLabels: Readonly<Record<string, string>>;
}): ReactElement | null {
  const details = event.details;

  if (AUDIT_ACTION_MODULES[event.action] === "EMAILS") {
    return Object.keys(details).length > 0 ? <AuditMailChanges event={event} /> : null;
  }

  const rows = auditEventRows({ event, roleLabels, permissionLabels });

  // Role snapshots preserve readable names, permissions and scopes instead of duplicating their technical references.
  const roleSnapshot =
    ["PERSON_ROLES_CHANGED", "ROLE_CREATED", "ROLE_UPDATED", "ROLE_DELETED"].includes(event.action) &&
    (details.before !== undefined || details.after !== undefined) &&
    rows.length > 0;

  if (event.history?.changes.some((change) => change.fields.length > 0) && !roleSnapshot) {
    return renderAuditHistoryChanges({
      history: event.history,
      entityId: event.entityId,
      supplementaryRows: rows,
      course: event.entityType === "COURSE",
    });
  }

  return rows.length > 0 ? <AuditComparisonTable label="Cambios" rows={rows} /> : null;
}

function auditEventRows({
  event,
  roleLabels,
  permissionLabels,
}: {
  event: AuditEvent;
  roleLabels: Readonly<Record<string, string>>;
  permissionLabels: Readonly<Record<string, string>>;
}): AuditComparisonRow[] {
  const details = event.details;

  if (Object.keys(details).length === 0) {
    return [];
  }

  if (event.action === "PERSON_ROLES_CHANGED" && (details.before !== undefined || details.after !== undefined)) {
    return [
      {
        key: "roles",
        label: "Roles y alcances",
        before: <RoleAssignments value={details.before} roleLabels={roleLabels} />,
        after: <RoleAssignments value={details.after} roleLabels={roleLabels} />,
      },
    ];
  }

  if (["ROLE_CREATED", "ROLE_UPDATED", "ROLE_DELETED"].includes(event.action) && (details.before !== undefined || details.after !== undefined)) {
    return [
      {
        key: "role",
        label: "Configuración del rol",
        before: <RoleConfiguration value={details.before} permissionLabels={permissionLabels} />,
        after: <RoleConfiguration value={details.after} permissionLabels={permissionLabels} />,
      },
    ];
  }

  if (details.before !== undefined || details.after !== undefined || Array.isArray(details.changedFields)) {
    return auditOperationRows(details);
  }

  const rows: AuditComparisonRow[] = [];

  if (typeof details.initialRole === "string") {
    rows.push({
      key: "initialRole",
      label: "Rol inicial",
      before: "No registrado",
      after: roleLabels[details.initialRole] ?? (details.initialRole === "PLATFORM_ADMIN" ? "Administrador de plataforma" : details.initialRole),
    });
  }

  for (const [key, label] of [
    ["enabled", "Acceso"],
    ["hasAccount", "Cuenta asociada"],
    ["personCreated", "Persona creada en esta operación"],
    ["emailVerificationRequired", "Requiere verificación de correo"],
  ]) {
    const value = details[key];

    if (typeof value === "boolean") {
      const access = key === "enabled";

      let displayValue = value ? "Sí" : "No";

      let previousValue = "No registrado";

      if (access) {
        displayValue = value ? "Habilitado" : "Deshabilitado";

        if (typeof details.previousEnabled === "boolean") {
          previousValue = details.previousEnabled ? "Habilitado" : "Deshabilitado";
        }
      }

      rows.push({
        key,
        label,
        before: previousValue,
        after: displayValue,
      });
    }
  }

  if (details.emailVerificationStatus === "PENDING" || details.emailVerificationStatus === "NOT_REQUIRED") {
    rows.push({
      key: "emailVerificationStatus",
      label: "Verificación de correo al crear la cuenta",
      before: "No registrado",
      after: details.emailVerificationStatus === "PENDING" ? "Pendiente" : "No requerida",
    });
  }

  return rows;
}

function RoleAssignments({ value, roleLabels }: { value: unknown; roleLabels: Readonly<Record<string, string>> }): ReactElement {
  const roles = Array.isArray(value) ? value.filter(isRecord) : [];

  return (
    <div className="min-w-0 space-y-3">
      {roles.length > 0 ? (
        <ul className="space-y-4">
          {roles.map((role, index) => (
            <li key={typeof role.roleId === "string" ? role.roleId : index} className="min-w-0 space-y-1 text-sm">
              <p className="font-medium">{roleAssignmentName(role, roleLabels)}</p>
              <p>Alcance: {roleAssignmentScope(role.accessScope)}</p>
              {Array.isArray(role.trainingPathIds) && role.trainingPathIds.length > 0 ? (
                <p className="text-muted-foreground">Trayectos seleccionados: {role.trainingPathIds.filter((id) => typeof id === "string").length}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">Sin roles asignados.</p>
      )}
    </div>
  );
}

function RoleConfiguration({ value, permissionLabels }: { value: unknown; permissionLabels: Readonly<Record<string, string>> }): ReactElement {
  const role = isRecord(value) ? value : {};

  const permissions = Array.isArray(role.permissions) ? role.permissions.filter((code): code is string => typeof code === "string") : [];

  return (
    <div className="min-w-0 space-y-3">
      {typeof role.name === "string" ? (
        <>
          <p className="text-sm font-medium">{role.name}</p>
          <h4 className="text-sm font-medium">Permisos efectivos</h4>
          {permissions.length > 0 ? (
            <ul className="list-inside list-disc space-y-2 text-sm">
              {permissions.map((code) => (
                <li key={code} className="break-words">
                  {permissionLabels[code] ?? `Permiso fuera del catálogo actual: ${code}`}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">Sin permisos.</p>
          )}
        </>
      ) : (
        <p className="text-muted-foreground text-sm">El rol no existía en este estado.</p>
      )}
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function roleAssignmentName(role: Record<string, unknown>, roleLabels: Readonly<Record<string, string>>): string {
  if (typeof role.roleName === "string") {
    return role.roleName;
  }

  if (typeof role.roleCode === "string") {
    return roleLabels[role.roleCode] ?? "Rol fuera del catálogo actual";
  }

  return "Rol no registrado";
}

function roleAssignmentScope(value: unknown): string {
  if (value === "INSTITUTION") {
    return "Toda la institución";
  }

  if (value === "TRAINING_PATHS") {
    return "Trayectos seleccionados";
  }

  return "No registrado";
}
