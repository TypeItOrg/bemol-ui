import type { ReactElement } from "react";

import { DETAIL_LABEL_CLASS_NAME } from "@common/constants/detail-label.constants";

import type { AuditEvent } from "@features/platform-audit/types/audit-event.types";

export function AuditMailChanges({ event }: { event: AuditEvent }): ReactElement {
  const sent = event.action === "EMAIL_SENT";

  const fields = [
    { label: "Tipo de correo", value: event.details.mailType },
    { label: "Destinatario", value: event.details.recipient },
    { label: "Resultado", value: sent ? "Aceptado por el servidor de correo" : "Envío fallido" },
  ];

  return (
    <div className="space-y-5">
      <dl className="grid gap-5 sm:grid-cols-2">
        {fields.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <dt className={DETAIL_LABEL_CLASS_NAME}>{label}</dt>
            <dd className="mt-1 text-sm break-words">{typeof value === "string" ? value : "No registrado"}</dd>
          </div>
        ))}
      </dl>
      {!sent ? <p className="text-muted-foreground text-sm">No se pudo confirmar el envío. No se realizan reintentos automáticos.</p> : null}
    </div>
  );
}
