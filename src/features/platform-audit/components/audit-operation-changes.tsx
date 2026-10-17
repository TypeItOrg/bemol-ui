import type { ReactElement } from "react";

import { DETAIL_LABEL_CLASS_NAME } from "@common/constants/detail-label.constants";
import { formatDisplayDate } from "@common/utils/date-input.util";

import {
  approvalModeLabels,
  courseStatusLabels,
  requiredConditionLabels,
  requirementStageLabels,
  requirementTypeLabels,
  studyPlanStatusLabels,
} from "@features/academic/utils/academic-labels.util";
import { DOCUMENT_LEVEL_LABELS } from "@features/enrollment-applications/constants/documentation.constants";
import { CHANGED_FIELD_LABELS, OPERATION_FIELD_LABELS } from "@features/platform-audit/constants/audit-operation-labels.constants";

const OPERATION_VALUE_LABELS: Readonly<Record<string, string>> = {
  ...courseStatusLabels,
  ...studyPlanStatusLabels,
  ...approvalModeLabels,
  ...requirementTypeLabels,
  ...requirementStageLabels,
  ...requiredConditionLabels,
};

export function AuditOperationChanges({ details }: { details: Record<string, unknown> }): ReactElement {
  const changedFields = Array.isArray(details.changedFields)
    ? [
        ...new Set(
          details.changedFields
            .filter((key): key is string => typeof key === "string")
            .map((key) => CHANGED_FIELD_LABELS[key])
            .filter(Boolean),
        ),
      ]
    : [];

  return (
    <div className="space-y-6">
      {typeof details.entityName === "string" ? <p className="text-sm font-medium break-words">{details.entityName}</p> : null}
      {typeof details.studyPlanName === "string" ? <p className="text-muted-foreground text-sm">Plan de estudio: {details.studyPlanName}</p> : null}
      {changedFields.length > 0 ? (
        <div>
          <h3 className={DETAIL_LABEL_CLASS_NAME}>Campos modificados</h3>
          <p className="mt-1 text-sm">{changedFields.join(", ")}</p>
        </div>
      ) : null}
      <div className="grid gap-6 sm:grid-cols-2">
        <OperationSnapshot title="Antes" value={details.before} />
        <OperationSnapshot title="Después" value={details.after} />
      </div>
    </div>
  );
}

function OperationSnapshot({ title, value }: { title: string; value: unknown }): ReactElement {
  const snapshot = isRecord(value) && Object.keys(value).length > 0 ? value : null;

  const fields = snapshot
    ? Object.entries(OPERATION_FIELD_LABELS).flatMap(([key, label]) => {
        if (!(key in snapshot)) {
          return [];
        }

        const displayValue = operationFieldValue(key, snapshot[key]);

        return displayValue === undefined ? [] : [{ label, value: displayValue }];
      })
    : [];

  const requirements = snapshot && Array.isArray(snapshot.requirements) ? snapshot.requirements.filter(isRecord) : [];

  return (
    <div className="min-w-0 space-y-3">
      <h3 className={DETAIL_LABEL_CLASS_NAME}>{title}</h3>
      {snapshot ? (
        <>
          <dl className="space-y-4">
            {fields.map((field) => (
              <div key={field.label}>
                <dt className={DETAIL_LABEL_CLASS_NAME}>{field.label}</dt>
                <dd className="mt-1 text-sm break-words">{field.value}</dd>
              </div>
            ))}
          </dl>
          {requirements.length > 0 ? (
            <div className="space-y-2">
              <h4 className={DETAIL_LABEL_CLASS_NAME}>Asignaciones documentales</h4>
              <ul className="space-y-3 text-sm">
                {requirements.map((requirement, index) => (
                  <li key={index} className="space-y-1">
                    {typeof requirement.trainingPathName === "string" ? (
                      <p className="font-medium break-words">{requirement.trainingPathName}</p>
                    ) : null}
                    {typeof requirement.level === "string" ? (
                      <p>{DOCUMENT_LEVEL_LABELS[requirement.level as keyof typeof DOCUMENT_LEVEL_LABELS] ?? "Nivel no catalogado"}</p>
                    ) : null}
                    {typeof requirement.displayOrder === "number" ? <p>Orden: {requirement.displayOrder}</p> : null}
                    {typeof requirement.active === "boolean" ? <p>{requirement.active ? "Activo" : "Inactivo"}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-muted-foreground text-sm">Sin estado registrado.</p>
      )}
    </div>
  );
}

function operationFieldValue(key: string, value: unknown): string | undefined {
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
    return key === "size" ? `${value.toLocaleString("es-AR")} bytes` : value.toLocaleString("es-AR");
  }

  if (Array.isArray(value)) {
    const values = value.filter((item): item is string => typeof item === "string");

    return values.length > 0 ? values.join(", ") : "Ninguno";
  }

  if (typeof value === "string") {
    if (key === "effectiveFrom" || key === "effectiveTo") {
      return formatDisplayDate(value);
    }

    if (["status", "approvalMode", "requirementType", "requirementStage", "requiredCondition"].includes(key)) {
      return OPERATION_VALUE_LABELS[value] ?? "Valor fuera del catálogo actual";
    }

    return value;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
