import type { ReactElement } from "react";

import { DETAIL_LABEL_CLASS_NAME } from "@common/constants/detail-label.constants";

import { AuditMailChanges } from "@features/platform-audit/components/audit-mail-changes";
import { AuditOperationChanges } from "@features/platform-audit/components/audit-operation-changes";
import { AUDIT_ACTION_MODULES } from "@features/platform-audit/constants/audit-labels.constants";
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

  if (Object.keys(details).length === 0) {
    return null;
  }

  if (AUDIT_ACTION_MODULES[event.action] === "EMAILS") {
    return <AuditMailChanges event={event} />;
  }

  if (event.action === "PERSON_ROLES_CHANGED") {
    return (
      <div className="grid gap-6 sm:grid-cols-2">
        <RoleAssignments title="Antes" value={details.before} roleLabels={roleLabels} />
        <RoleAssignments title="Después" value={details.after} roleLabels={roleLabels} />
      </div>
    );
  }

  if (["ROLE_CREATED", "ROLE_UPDATED", "ROLE_DELETED"].includes(event.action)) {
    return (
      <div className="grid gap-6 sm:grid-cols-2">
        <RoleConfiguration title="Antes" value={details.before} permissionLabels={permissionLabels} />
        <RoleConfiguration title="Después" value={details.after} permissionLabels={permissionLabels} />
      </div>
    );
  }

  if (["INSTITUTIONS", "COURSES", "STUDY_PLANS", "DOCUMENTATION"].includes(AUDIT_ACTION_MODULES[event.action])) {
    return <AuditOperationChanges details={details} />;
  }

  const fields: { label: string; value: string }[] = [];

  if (typeof details.initialRole === "string") {
    fields.push({
      label: "Rol inicial",
      value: roleLabels[details.initialRole] ?? (details.initialRole === "PLATFORM_ADMIN" ? "Administrador de plataforma" : details.initialRole),
    });
  }

  for (const [key, label] of [
    ["previousEnabled", "Acceso anterior"],
    ["enabled", "Acceso posterior"],
    ["hasAccount", "Cuenta asociada"],
    ["personCreated", "Persona creada en esta operación"],
    ["emailVerificationRequired", "Requiere verificación de correo"],
  ]) {
    const value = details[key];

    if (typeof value === "boolean") {
      const access = key === "previousEnabled" || key === "enabled";

      let displayValue = value ? "Sí" : "No";

      if (access) {
        displayValue = value ? "Habilitado" : "Deshabilitado";
      }

      fields.push({ label, value: displayValue });
    }
  }

  if (details.emailVerificationStatus === "PENDING" || details.emailVerificationStatus === "NOT_REQUIRED") {
    fields.push({
      label: "Verificación de correo al crear la cuenta",
      value: details.emailVerificationStatus === "PENDING" ? "Pendiente" : "No requerida",
    });
  }

  if (fields.length === 0) {
    return null;
  }

  return (
    <dl className="grid gap-5 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.label}>
          <dt className={DETAIL_LABEL_CLASS_NAME}>{field.label}</dt>
          <dd className="mt-1 text-sm">{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function RoleAssignments({
  title,
  value,
  roleLabels,
}: {
  title: string;
  value: unknown;
  roleLabels: Readonly<Record<string, string>>;
}): ReactElement {
  const roles = Array.isArray(value) ? value.filter(isRecord) : [];

  return (
    <div className="min-w-0 space-y-3">
      <h3 className={DETAIL_LABEL_CLASS_NAME}>{title}</h3>
      {roles.length > 0 ? (
        <ul className="space-y-4">
          {roles.map((role, index) => (
            <li key={typeof role.roleId === "string" ? role.roleId : index} className="min-w-0 space-y-1 text-sm">
              <p className="font-medium">{roleAssignmentName(role, roleLabels)}</p>
              {typeof role.roleId === "string" ? <p className="text-muted-foreground break-all">Identificador del rol: {role.roleId}</p> : null}
              <p>Alcance: {roleAssignmentScope(role.accessScope)}</p>
              {Array.isArray(role.trainingPathIds) && role.trainingPathIds.length > 0 ? (
                <ul className="text-muted-foreground space-y-1">
                  {role.trainingPathIds
                    .filter((id): id is string => typeof id === "string")
                    .map((id) => (
                      <li key={id} className="break-all">
                        Identificador del trayecto: {id}
                      </li>
                    ))}
                </ul>
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

function RoleConfiguration({
  title,
  value,
  permissionLabels,
}: {
  title: string;
  value: unknown;
  permissionLabels: Readonly<Record<string, string>>;
}): ReactElement {
  const role = isRecord(value) ? value : {};

  const permissions = Array.isArray(role.permissions) ? role.permissions.filter((code): code is string => typeof code === "string") : [];

  return (
    <div className="min-w-0 space-y-3">
      <h3 className={DETAIL_LABEL_CLASS_NAME}>{title}</h3>
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
