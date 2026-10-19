import type { ReactElement, ReactNode } from "react";

import Link from "next/link";

import { ClipboardListIcon, MailIcon, ScrollTextIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";
import { Button } from "@common/components/ui/button";
import { DETAIL_LABEL_CLASS_NAME } from "@common/constants/detail-label.constants";

import { renderAuditEventChanges } from "@features/platform-audit/components/audit-event-changes";
import { AUDIT_ACTION_LABELS, AUDIT_ACTION_MODULES, AUDIT_ENTITY_LABELS } from "@features/platform-audit/constants/audit-labels.constants";
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
          title="Datos del evento"
          description="Qué ocurrió, cuándo y quién lo realizó."
          descriptionBreakpoint="sm"
        />
        <dl className="grid gap-5 sm:grid-cols-2">
          <DetailItem label="Acción" value={AUDIT_ACTION_LABELS[event.action] ?? "Acción no catalogada"} />
          <DetailItem label="Fecha y hora" value={formatAuditDateTime(event.occurredAt)} />
          <DetailItem label="Realizado por" value={auditActorName(event)} />
          <DetailItem label="Institución" value={auditInstitutionName(event)} />
          <DetailItem label="Entidad" value={AUDIT_ENTITY_LABELS[event.entityType] ?? event.entityType} />
          {typeof event.details.entityName === "string" ? <DetailItem label="Registro" value={event.details.entityName} /> : null}
          {typeof event.details.studyPlanName === "string" ? <DetailItem label="Plan de estudio" value={event.details.studyPlanName} /> : null}
          {event.subjectPersonId ? <DetailItem label="Persona afectada" value={event.subjectName ?? "Persona eliminada o no disponible"} /> : null}
        </dl>
      </section>
      {changes ? (
        <section className="bg-muted/25 space-y-5 rounded-xl border p-4 sm:p-5">
          <SectionHeader
            icon={AUDIT_ACTION_MODULES[event.action] === "EMAILS" ? MailIcon : ClipboardListIcon}
            title={AUDIT_ACTION_MODULES[event.action] === "EMAILS" ? "Datos del correo" : "Cambios"}
            description={
              AUDIT_ACTION_MODULES[event.action] === "EMAILS"
                ? "Tipo, destinatario y resultado del envío."
                : "Campos modificados y sus valores anteriores y nuevos."
            }
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
