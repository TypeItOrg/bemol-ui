import { AUDIT_ACTOR_LABELS } from "@features/platform-audit/constants/audit-labels.constants";
import type { AuditEvent } from "@features/platform-audit/types/audit-event.types";

const formatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "medium",
  hourCycle: "h23",
  timeZone: "America/Argentina/Cordoba",
});

export function formatAuditDateTime(value: string): string {
  return formatter.format(new Date(value));
}

export function auditActorName(event: AuditEvent): string {
  if (event.actorKind === "ANONYMOUS") {
    return AUDIT_ACTOR_LABELS.ANONYMOUS;
  }

  return event.actorName ?? "Actor eliminado o no disponible";
}

export function auditInstitutionName(event: AuditEvent): string {
  return event.institutionId ? (event.institutionName ?? "Institución no disponible") : "Plataforma";
}
