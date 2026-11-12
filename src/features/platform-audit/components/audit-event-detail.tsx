import type { ReactElement, ReactNode } from "react";

import Link from "next/link";

import { ClipboardListIcon, MailIcon, ScrollTextIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";
import { Button } from "@common/components/ui/button";
import { DETAIL_LABEL_CLASS_NAME } from "@common/constants/detail-label.constants";

import { renderAuditEventChanges } from "@features/platform-audit/components/audit-event-changes";
import type { AuditEvent } from "@features/platform-audit/types/audit-event.types";
import { auditActionLabel, auditActorName, auditInstitutionName, formatAuditDateTime } from "@features/platform-audit/utils/audit-display.util";

export function AuditEventDetail({ event, returnTo }: { event: AuditEvent; returnTo: string }): ReactElement {
  const changes = renderAuditEventChanges({ event });

  return (
    <>
      <div>
        <Button asChild variant="outline" size="lg">
          <Link href={returnTo}>Volver</Link>
        </Button>
      </div>
      <section className="bg-muted/25 space-y-5 rounded-xl border p-4 sm:p-5">
        <header className="-mx-4 border-b px-4 pb-4 sm:-mx-5 sm:px-5 sm:pb-5">
          <SectionHeader
            icon={ScrollTextIcon}
            title="Datos del evento"
            description="Qué ocurrió, cuándo y quién lo realizó."
            descriptionBreakpoint="sm"
          />
        </header>
        <dl className="grid gap-5 sm:grid-cols-2">
          <DetailItem label="Acción" value={auditActionLabel(event)} />
          <DetailItem label="Fecha y hora" value={formatAuditDateTime(event.occurredAt)} />
          <DetailItem label="Realizado por" value={auditActorName(event)} />
          <DetailItem label="Institución" value={auditInstitutionName(event)} />
          <DetailItem label="Entidad" value={event.entityLabel ?? event.entityType} />
          {typeof event.details.entityName === "string" ? <DetailItem label="Registro" value={event.details.entityName} /> : null}
          {typeof event.details.studyPlanName === "string" ? <DetailItem label="Plan de estudio" value={event.details.studyPlanName} /> : null}
          {event.subjectPersonId ? <DetailItem label="Persona afectada" value={event.subjectName ?? "Persona eliminada o no disponible"} /> : null}
        </dl>
      </section>
      {changes ? (
        <section className="bg-muted/25 space-y-5 rounded-xl border p-4 sm:p-5">
          <header className="-mx-4 border-b px-4 pb-4 sm:-mx-5 sm:px-5 sm:pb-5">
            <SectionHeader
              icon={event.entityType === "EMAIL" ? MailIcon : ClipboardListIcon}
              title={event.entityType === "EMAIL" ? "Datos del correo" : "Cambios"}
              description={
                event.entityType === "EMAIL" ? "Tipo, destinatario y resultado del envío." : "Campos modificados y sus valores anteriores y nuevos."
              }
              descriptionBreakpoint="sm"
            />
          </header>
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
