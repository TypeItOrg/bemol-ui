import type { ReactElement } from "react";

import { ChevronDownIcon, CodeIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";
import { Button } from "@common/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@common/components/ui/collapsible";
import { DETAIL_LABEL_CLASS_NAME } from "@common/constants/detail-label.constants";

import { AUDIT_ACTOR_LABELS, AUDIT_ORIGIN_LABELS } from "@features/platform-audit/constants/audit-labels.constants";
import type { AuditEvent } from "@features/platform-audit/types/audit-event.types";

export function AuditTechnicalDetails({ event }: { event: AuditEvent }): ReactElement {
  const fields = [
    { label: "Tipo de actor", value: AUDIT_ACTOR_LABELS[event.actorKind] },
    { label: "Origen", value: event.origin ? (AUDIT_ORIGIN_LABELS[event.origin] ?? "Origen no catalogado") : "No registrado" },
    { label: "Identificador de la petición", value: event.requestId },
  ].filter((item) => item.value !== null);

  return (
    <Collapsible className="bg-muted/25 space-y-5 rounded-xl border p-4 sm:p-5">
      <SectionHeader
        icon={CodeIcon}
        title="Información técnica"
        description="Origen y referencia para soporte."
        descriptionBreakpoint="sm"
        action={
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="lg" className="group" aria-label="Información técnica">
              Ver detalle
              <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
            </Button>
          </CollapsibleTrigger>
        }
      />
      <CollapsibleContent className="space-y-5">
        <dl className="grid gap-5 sm:grid-cols-2">
          {fields.map((item, index) => (
            <div key={`${item.label}:${index}`} className="min-w-0">
              <dt className={DETAIL_LABEL_CLASS_NAME}>{item.label}</dt>
              <dd className="mt-1 text-sm break-all">{item.value}</dd>
            </div>
          ))}
        </dl>
      </CollapsibleContent>
    </Collapsible>
  );
}
