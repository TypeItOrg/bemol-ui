import type { ReactElement } from "react";

import { formatDisplayDate } from "@common/utils/date-input.util";

import { COURSE_DAY_LABELS, WAITLIST_REASON_LABELS } from "@features/course-enrollments/constants/course-enrollment.constants";
import { DOCUMENT_LEVEL_LABELS } from "@features/enrollment-applications/constants/documentation.constants";
import { GUARDIAN_RELATIONSHIP_LABELS } from "@features/guardian-dependents/constants/guardian-dependent.constants";
import { AuditComparisonTable } from "@features/platform-audit/components/audit-comparison-table";
import { auditCourseRows } from "@features/platform-audit/components/audit-course-changes";
import { operationFieldValue } from "@features/platform-audit/components/audit-operation-changes";
import type { AuditComparisonRow } from "@features/platform-audit/types/audit-comparison-row.types";
import type { AuditFieldChange } from "@features/platform-audit/types/audit-field-change.types";
import type { AuditHistory } from "@features/platform-audit/types/audit-history.types";
import { formatAuditDateTime } from "@features/platform-audit/utils/audit-display.util";

const OPERATION_LABELS = { CREATED: "Creación", UPDATED: "Modificación", DELETED: "Eliminación" };

const FIELD_VALUE_LABELS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  day_of_week: COURSE_DAY_LABELS,
  waitlist_reason: WAITLIST_REASON_LABELS,
  relationship: GUARDIAN_RELATIONSHIP_LABELS,
  level: DOCUMENT_LEVEL_LABELS,
  access_scope: { INSTITUTION: "Toda la institución", TRAINING_PATHS: "Trayectos seleccionados" },
  email_verification_status: { PENDING: "Pendiente", VERIFIED: "Verificado", NOT_REQUIRED: "No requerida" },
};

export function renderAuditHistoryChanges({
  history,
  entityId,
  supplementaryRows,
  course = false,
}: {
  history: AuditHistory;
  entityId: string;
  supplementaryRows: AuditComparisonRow[];
  course?: boolean;
}): ReactElement | null {
  const rootFields = new Set(
    history.changes
      .filter((change) => change.entityId === entityId)
      .flatMap((change) => change.fields.map((field) => field.field.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()))),
  );

  const rows: AuditComparisonRow[] = history.changes.flatMap((change, index) =>
    change.fields.flatMap((field) => {
      if (course && (field.valueType === "REFERENCE" || (change.entityId !== entityId && change.operation !== "UPDATED"))) {
        return [];
      }

      const key = field.field.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

      const snapshot = change.entityId === entityId ? supplementaryRows.find((row) => row.key === key) : undefined;

      return {
        key: `${change.entity}:${change.entityId}:${field.field}`,
        label: (
          <>
            <span>{field.label}</span>
            {!course && history.changes.length > 1 ? (
              <span className="text-muted-foreground mt-1 block text-xs font-normal">
                {change.entity} · {OPERATION_LABELS[change.operation]} · Registro {index + 1}
              </span>
            ) : null}
          </>
        ),
        before: change.previousKnown ? displayValue(field, field.before) : (snapshot?.before ?? "No registrado"),
        after: displayValue(field, field.after),
      };
    }),
  );

  const hasClassHistory =
    course && history.changes.some((change) => ["Clase", "Docente de clase", "Día de clase", "Horario de clase"].includes(change.entity));

  rows.push(...(course ? auditCourseRows(history) : []));
  rows.push(
    ...supplementaryRows.filter(
      (row) =>
        !rootFields.has(row.key) && !(hasClassHistory && ["classes", "classCount", "teacherCount", "dayCount", "scheduleCount"].includes(row.key)),
    ),
  );

  return rows.length > 0 ? <AuditComparisonTable label="Cambios" rows={rows} /> : null;
}

function displayValue(field: AuditFieldChange, value: string | null): string {
  if (value === null) {
    return "Sin valor";
  }

  if (field.valueType === "BOOLEAN") {
    return value === "true" ? "Sí" : "No";
  }

  if (field.valueType === "NUMBER") {
    return field.field === "year" ? value : Number(value).toLocaleString("es-AR");
  }

  if (field.valueType === "DATETIME") {
    return formatAuditDateTime(value);
  }

  if (field.valueType === "DATE") {
    return formatDisplayDate(value);
  }

  if (field.valueType === "JSON") {
    const parsed: unknown = JSON.parse(value);

    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return parsed.length > 0 ? parsed.join(", ") : "Ninguno";
    }

    return value;
  }

  if (FIELD_VALUE_LABELS[field.field]) {
    return FIELD_VALUE_LABELS[field.field][value] ?? value;
  }

  const key = field.field.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

  const formatted = operationFieldValue(key, value);

  return formatted === "Valor fuera del catálogo actual" ? value : (formatted ?? value);
}
