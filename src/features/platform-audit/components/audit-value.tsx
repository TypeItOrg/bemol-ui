import type { ReactElement } from "react";

import { formatDisplayDate } from "@common/utils/date-input.util";

import { formatAuditDateTime } from "@features/platform-audit/utils/audit-display.util";
import { operationFieldValue } from "@features/platform-audit/utils/audit-field-value.util";

export function AuditValue({ field, value }: { field: string; value: unknown }): ReactElement {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span>Ninguno</span>;
    }

    return (
      <ul className="space-y-3">
        {value.map((item, index) => (
          <li key={index}>
            <AuditValue field={field} value={item} />
          </li>
        ))}
      </ul>
    );
  }

  if (isRecord(value)) {
    if (value.type === "DATE" && typeof value.value === "string") {
      return <span>{formatDisplayDate(value.value)}</span>;
    }

    if (value.type === "DATETIME" && typeof value.value === "string") {
      return <span>{formatAuditDateTime(value.value)}</span>;
    }

    if (typeof value.label === "string" && ("code" in value || "id" in value)) {
      return <span>{value.label}</span>;
    }

    const labels = isRecord(value.fieldLabels) ? value.fieldLabels : null;

    if (!labels) {
      return <span>No registrado</span>;
    }

    const entries = Object.entries(labels);

    return (
      <dl className="space-y-2">
        {entries
          .filter(([key, label]) => typeof key === "string" && key in value && typeof label === "string")
          .map(([key, label]) => (
            <div key={String(key)}>
              <dt className="font-medium">{String(label)}</dt>
              <dd>
                <AuditValue field={String(key)} value={value[String(key)]} />
              </dd>
            </div>
          ))}
      </dl>
    );
  }

  return <span>{operationFieldValue(field, value) ?? "No registrado"}</span>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
