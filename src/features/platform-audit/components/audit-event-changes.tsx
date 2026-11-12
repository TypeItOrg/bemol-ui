import type { ReactElement } from "react";

import { AuditComparisonTable } from "@features/platform-audit/components/audit-comparison-table";
import { AuditMailChanges } from "@features/platform-audit/components/audit-mail-changes";
import { auditOperationRows } from "@features/platform-audit/components/audit-operation-changes";
import type { AuditEvent } from "@features/platform-audit/types/audit-event.types";

export function renderAuditEventChanges({ event }: { event: AuditEvent }): ReactElement | null {
  if (event.entityType === "EMAIL") {
    return Object.keys(event.details).length > 0 ? <AuditMailChanges event={event} /> : null;
  }

  const rows = auditOperationRows(event.details);

  return rows.length > 0 ? <AuditComparisonTable label="Cambios" rows={rows} /> : null;
}
