import type { AuditActorKind } from "@features/platform-audit/types/audit-actor-kind.types";
import type { AuditModule } from "@features/platform-audit/types/audit-module.types";

export type AuditFilters = {
  page: number;
  size: number;
  scope?: "PLATFORM" | "INSTITUTION";
  institutionId?: string;
  search?: string;
  module?: AuditModule;
  personId?: string;
  action?: string;
  actorKind?: AuditActorKind;
  actorId?: string;
  requestId?: string;
  from?: string;
  to?: string;
  dateError?: string;
};
