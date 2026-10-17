import type { ReactElement, ReactNode } from "react";

import Link from "next/link";

import { ClipboardListIcon, ScrollTextIcon, UsersIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";
import { Button } from "@common/components/ui/button";
import { DETAIL_LABEL_CLASS_NAME } from "@common/constants/detail-label.constants";

import { renderAuditEventChanges } from "@features/platform-audit/components/audit-event-changes";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTOR_LABELS,
  AUDIT_ENTITY_LABELS,
  AUDIT_ORIGIN_LABELS,
} from "@features/platform-audit/constants/audit-labels.constants";
import type { AuditEvent } from "@features/platform-audit/types/audit-event.types";
import { auditActorName, auditInstitutionName, formatAuditDateTime } from "@features/platform-audit/utils/audit-display.util";

export function AuditEventDetail({
  event,
  returnTo,
  roleLabels,
  permissionLabels,
}: {
  event: AuditEvent;
  returnTo: string;
  roleLabels: Readonly<Record<string, string>>;
  permissionLabels: Readonly<Record<string, string>>;
}): ReactElement {
  const changes = renderAuditEventChanges({ event, roleLabels, permissionLabels });

  return (
    <>
      <div>
        <Button asChild variant="outline" size="lg">
          <Link href={returnTo}>Volver</Link>
        </Button>
      </div>
      <section className="bg-muted/25 space-y-5 rounded-xl border p-4 sm:p-5">
        <SectionHeader
          icon={ScrollTextIcon}
          title={AUDIT_ACTION_LABELS[event.action] ?? "Acción no catalogada"}
          description={formatAuditDateTime(event.occurredAt)}
          descriptionBreakpoint="sm"
        />
        <dl className="grid gap-5 sm:grid-cols-2">
          <DetailItem label="Identificador del evento" value={event.id} />
          <DetailItem label="Entidad" value={AUDIT_ENTITY_LABELS[event.entityType] ?? event.entityType} />
          <DetailItem label="Identificador de la entidad" value={event.entityId} />
          <DetailItem label="Origen" value={event.origin ? (AUDIT_ORIGIN_LABELS[event.origin] ?? "Origen no catalogado") : "No registrado"} />
          <DetailItem label="Identificador de la petición" value={event.requestId ?? "No registrado"} />
          <DetailItem
            label={event.origin === null ? "Actor distinto de la persona afectada" : "Actuó en representación"}
            value={
              <>
                <span>{event.actedOnBehalf ? "Sí" : "No"}</span>
                {event.origin === null ? (
                  <span className="text-muted-foreground mt-1 block text-xs">Indicador del registro anterior; no acredita representación.</span>
                ) : null}
              </>
            }
          />
        </dl>
      </section>
      <section className="bg-muted/25 space-y-5 rounded-xl border p-4 sm:p-5">
        <SectionHeader
          icon={UsersIcon}
          title="Personas y ámbito"
          description="Nombres actuales e identificadores históricos."
          descriptionBreakpoint="sm"
        />
        <dl className="grid gap-5 sm:grid-cols-2">
          <DetailItem
            label="Actor"
            value={
              <>
                <span>{auditActorName(event)}</span>
                {event.actorKind !== "ANONYMOUS" ? (
                  <span className="text-muted-foreground mt-1 block text-xs">{AUDIT_ACTOR_LABELS[event.actorKind]}</span>
                ) : null}
              </>
            }
          />
          {event.actorId ? (
            <DetailItem
              label={event.actorKind === "PLATFORM" ? "Identificador de la cuenta de plataforma" : "Identificador de la persona actora"}
              value={event.actorId}
            />
          ) : null}
          <DetailItem
            label="Persona afectada"
            value={event.subjectPersonId ? (event.subjectName ?? "Persona eliminada o no disponible") : "No corresponde"}
          />
          {event.subjectPersonId ? <DetailItem label="Identificador de la persona afectada" value={event.subjectPersonId} /> : null}
          <DetailItem label="Institución" value={auditInstitutionName(event)} />
          {event.institutionId ? <DetailItem label="Identificador de la institución" value={event.institutionId} /> : null}
        </dl>
      </section>
      {changes ? (
        <section className="bg-muted/25 space-y-5 rounded-xl border p-4 sm:p-5">
          <SectionHeader
            icon={ClipboardListIcon}
            title="Detalles de la operación"
            description="Estado registrado al momento del evento."
            descriptionBreakpoint="sm"
          />
          {changes}
        </section>
      ) : null}
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }): ReactElement {
  return (
    <div className="min-w-0">
      <dt className={DETAIL_LABEL_CLASS_NAME}>{label}</dt>
      <dd className="mt-1 text-sm break-words">{value}</dd>
    </div>
  );
}
