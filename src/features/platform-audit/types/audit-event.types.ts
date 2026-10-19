import type { AuditActorKind } from "@features/platform-audit/types/audit-actor-kind.types";
import type { AuditHistory } from "@features/platform-audit/types/audit-history.types";

export type AuditEvent = {
  id: string;
  actorKind: AuditActorKind;
  actorId: string | null;
  actorName: string | null;
  subjectPersonId: string | null;
  subjectName: string | null;
  institutionId: string | null;
  institutionName: string | null;
  action: string;
  entityType: string;
  entityId: string;
  actedOnBehalf: boolean;
  requestId: string | null;
  origin: string | null;
  details: Record<string, unknown>;
  occurredAt: string;
  history: AuditHistory | null;
};
