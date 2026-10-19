import type { AuditEntityChange } from "@features/platform-audit/types/audit-entity-change.types";

export type AuditHistory = {
  revision: number;
  changes: AuditEntityChange[];
};
