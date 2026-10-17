import type { AuditModule } from "@features/platform-audit/types/audit-module.types";

export type AuditActionOption = {
  action: string;
  label: string;
  module: AuditModule;
};
