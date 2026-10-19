import type { ReactElement } from "react";

import { formatDisplayDate } from "@common/utils/date-input.util";

import {
  academicYearStatusLabels,
  academicSpaceTypeLabels,
  academicSpaceFormatLabels,
  approvalModeLabels,
  courseStatusLabels,
  requiredConditionLabels,
  requirementStageLabels,
  requirementTypeLabels,
  studyPlanStatusLabels,
} from "@features/academic/utils/academic-labels.util";
import {
  ACADEMIC_ENROLLMENT_STATUS_LABELS,
  COURSE_ENROLLMENT_STATUS_LABELS,
} from "@features/course-enrollments/constants/course-enrollment.constants";
import { DOCUMENT_LEVEL_LABELS } from "@features/enrollment-applications/constants/documentation.constants";
import { ENROLLMENT_APPLICATION_STATUS_LABELS } from "@features/enrollment-applications/constants/enrollment-application.constants";
import { CHANGED_FIELD_LABELS, OPERATION_FIELD_LABELS } from "@features/platform-audit/constants/audit-operation-labels.constants";
import type { AuditComparisonRow } from "@features/platform-audit/types/audit-comparison-row.types";
import { formatAuditDateTime } from "@features/platform-audit/utils/audit-display.util";

const OPERATION_VALUE_LABELS: Readonly<Record<string, string>> = {
  ...courseStatusLabels,
  ...studyPlanStatusLabels,
  ...approvalModeLabels,
  ...requirementTypeLabels,
  ...requirementStageLabels,
  ...requiredConditionLabels,
  ...academicYearStatusLabels,
  ...academicSpaceTypeLabels,
  ...academicSpaceFormatLabels,
  ...ENROLLMENT_APPLICATION_STATUS_LABELS,
  ...COURSE_ENROLLMENT_STATUS_LABELS,
  ...ACADEMIC_ENROLLMENT_STATUS_LABELS,
  OPEN: "Abierto",
  PENDING: "Pendiente",
  PENDING_REVIEW: "Pendiente de revisión",
  WAITLISTED: "En lista de espera",
  CURRENT: "Vigente",
  SUPERSEDED: "Reemplazado",
  ACCEPTED: "Aceptado",
  OBSERVED: "Observado",
};

export function auditOperationRows(details: Record<string, unknown>): AuditComparisonRow[] {
  const changedFields = Array.isArray(details.changedFields)
    ? [
        ...new Set(
          details.changedFields.filter((key): key is string => typeof key === "string").filter((key) => Object.hasOwn(CHANGED_FIELD_LABELS, key)),
        ),
      ]
    : [];

  const before = isRecord(details.before) ? details.before : {};

  const after = isRecord(details.after) ? details.after : {};

  const rows: AuditComparisonRow[] = Object.entries(OPERATION_FIELD_LABELS).flatMap(([key, label]) => {
    if (!(key in before) && !(key in after)) {
      return [];
    }

    if (key in before && key in after && JSON.stringify(before[key]) === JSON.stringify(after[key])) {
      return [];
    }

    const previous = key in before ? operationFieldValue(key, before[key]) : "Sin estado registrado";

    const current = key in after ? operationFieldValue(key, after[key]) : "Sin estado registrado";

    if (previous === undefined && current === undefined) {
      return [];
    }

    return [{ key, label, before: previous ?? "No registrado", after: current ?? "No registrado" }];
  });

  if (
    (Array.isArray(before.requirements) || Array.isArray(after.requirements)) &&
    JSON.stringify(before.requirements) !== JSON.stringify(after.requirements)
  ) {
    rows.push({
      key: "requirements",
      label: "Asignaciones documentales",
      before: <DocumentRequirements value={before.requirements} />,
      after: <DocumentRequirements value={after.requirements} />,
    });
  }

  for (const key of changedFields) {
    if (!(key in before) && !(key in after) && !rows.some((row) => row.key === key)) {
      rows.push({ key, label: CHANGED_FIELD_LABELS[key], before: "No registrado", after: "No registrado" });
    }
  }

  return rows;
}

function DocumentRequirements({ value }: { value: unknown }): ReactElement {
  const requirements = Array.isArray(value) ? value.filter(isRecord) : [];

  return requirements.length > 0 ? (
    <ul className="space-y-3">
      {requirements.map((requirement, index) => (
        <li key={index} className="space-y-1">
          {typeof requirement.trainingPathName === "string" ? <p className="font-medium break-words">{requirement.trainingPathName}</p> : null}
          {typeof requirement.level === "string" ? (
            <p>{DOCUMENT_LEVEL_LABELS[requirement.level as keyof typeof DOCUMENT_LEVEL_LABELS] ?? "Nivel no catalogado"}</p>
          ) : null}
          {typeof requirement.displayOrder === "number" ? <p>Orden: {requirement.displayOrder}</p> : null}
          {typeof requirement.active === "boolean" ? <p>{requirement.active ? "Activo" : "Inactivo"}</p> : null}
        </li>
      ))}
    </ul>
  ) : (
    <span className="text-muted-foreground">Sin asignaciones.</span>
  );
}

export function operationFieldValue(key: string, value: unknown): string | undefined {
  if (value === null) {
    return "Sin especificar";
  }

  if (typeof value === "boolean") {
    if (key === "active") {
      return value ? "Activo" : "Inactivo";
    }

    return value ? "Sí" : "No";
  }

  if (typeof value === "number") {
    if (key === "year") {
      return String(value);
    }

    return key === "size" ? `${value.toLocaleString("es-AR")} bytes` : value.toLocaleString("es-AR");
  }

  if (Array.isArray(value)) {
    const values = value.filter((item): item is string => typeof item === "string");

    return values.length > 0 ? values.join(", ") : "Ninguno";
  }

  if (typeof value === "string") {
    if (["effectiveFrom", "effectiveTo", "startDate", "endDate"].includes(key)) {
      return value.includes("T") ? formatAuditDateTime(value) : formatDisplayDate(value);
    }

    if (key === "versionStatus") {
      return (
        ({ CURRENT: "Vigente", SUPERSEDED: "Reemplazado", WITHDRAWN: "Retirado" } as Record<string, string>)[value] ??
        "Valor fuera del catálogo actual"
      );
    }

    if (
      [
        "status",
        "academicStatus",
        "reviewStatus",
        "type",
        "format",
        "approvalMode",
        "requirementType",
        "requirementStage",
        "requiredCondition",
      ].includes(key)
    ) {
      return OPERATION_VALUE_LABELS[value] ?? "Valor fuera del catálogo actual";
    }

    return value;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
