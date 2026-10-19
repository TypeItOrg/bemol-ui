import type { AuditFieldChange } from "@features/platform-audit/types/audit-field-change.types";

export type AuditEntityChange = {
  entity: string;
  entityId: string;
  operation: "CREATED" | "UPDATED" | "DELETED";
  previousKnown: boolean;
  fields: AuditFieldChange[];
};
