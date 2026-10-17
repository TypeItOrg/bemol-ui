import type { AuditActorKind } from "@features/platform-audit/types/audit-actor-kind.types";

export type AuditActorOption = {
  actorKind: Exclude<AuditActorKind, "ANONYMOUS">;
  actorId: string;
  label: string;
};
