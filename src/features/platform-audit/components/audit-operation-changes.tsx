import type { ReactElement } from "react";

import { AuditValue } from "@features/platform-audit/components/audit-value";
import type { AuditComparisonRow } from "@features/platform-audit/types/audit-comparison-row.types";
import { operationFieldValue } from "@features/platform-audit/utils/audit-field-value.util";

export function auditOperationRows(details: Record<string, unknown>): AuditComparisonRow[] {
  const fieldLabels = new Map<string, string>();

  if (isRecord(details.fieldLabels)) {
    for (const [key, label] of Object.entries(details.fieldLabels)) {
      if (typeof label === "string" && label.trim()) {
        fieldLabels.set(key, label);
      }
    }
  }

  const changedFields = Array.isArray(details.changedFields)
    ? [...new Set(details.changedFields.filter((key): key is string => typeof key === "string").filter((key) => fieldLabels.has(key)))]
    : [];

  const before = isRecord(details.before) ? details.before : {};

  const after = isRecord(details.after) ? details.after : {};

  const rows: AuditComparisonRow[] = [...fieldLabels].flatMap(([key, label]) => {
    if (!(key in before) && !(key in after)) {
      return [];
    }

    if (!changedFields.includes(key) && key in before && key in after && JSON.stringify(before[key]) === JSON.stringify(after[key])) {
      return [];
    }

    const previous = key in before ? auditValue(key, before[key]) : "Sin estado registrado";

    const current = key in after ? auditValue(key, after[key]) : "Sin estado registrado";

    if (
      changedFields.includes(key) &&
      typeof before[key] === "object" &&
      before[key] !== null &&
      JSON.stringify(before[key]) === JSON.stringify(after[key])
    ) {
      return [{ key, label, before: "No registrado", after: "No registrado" }];
    }

    return [{ key, label, before: previous ?? "No registrado", after: current ?? "No registrado" }];
  });

  for (const key of changedFields) {
    if (!(key in before) && !(key in after) && !rows.some((row) => row.key === key)) {
      rows.push({ key, label: fieldLabels.get(key) ?? key, before: "No registrado", after: "No registrado" });
    }
  }

  return rows;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function auditValue(field: string, value: unknown): ReactElement | string {
  if (Array.isArray(value) && value.length === 0) {
    return "Ninguno";
  }

  return typeof value === "object" && value !== null ? (
    <AuditValue field={field} value={value} />
  ) : (
    (operationFieldValue(field, value) ?? "No registrado")
  );
}
