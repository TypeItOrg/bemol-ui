import type { ReactElement } from "react";

import { DETAIL_LABEL_CLASS_NAME } from "@common/constants/detail-label.constants";

import { formatEnrollmentApplicationDateTime } from "@features/enrollment-applications/utils/enrollment-application-date.util";
import type { AccountAccess } from "@features/people/types/account-access.types";

const STATUS_LABELS = { PENDING: "Pendiente", EXPIRED: "Vencida", USED: "Utilizada", CANCELLED: "Cancelada" };

const ISSUER_LABELS = { PLATFORM: "Plataforma", INSTITUTION: "Institución", GUARDIAN: "Tutor" };

const MAIL_LABELS = { SENT: "Correo enviado (no confirma entrega ni lectura)", FAILED: "Falló el envío; podés reintentarlo" };

export function AccountInvitationDetails({ invitation }: { invitation: NonNullable<AccountAccess["invitation"]> }): ReactElement {
  const date = formatEnrollmentApplicationDateTime;

  const fields = [
    ["Última invitación", `${STATUS_LABELS[invitation.status]} · ${invitation.purpose === "AUTONOMY" ? "Toma de control" : "Alta inicial"}`],
    ["Emisor", `${ISSUER_LABELS[invitation.issuerKind]} · ${invitation.issuerName ?? invitation.issuerId}`],
    ["Emitida", date(invitation.issuedAt)],
    ["Vence", date(invitation.expiresAt)],
    ...(invitation.usedAt ? [["Utilizada", date(invitation.usedAt)]] : []),
    ...(invitation.cancelledAt ? [["Cancelada", date(invitation.cancelledAt)]] : []),
    ["Envío", invitation.mailOutcome ? MAIL_LABELS[invitation.mailOutcome] : "Envío pendiente de procesamiento"],
  ];

  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt className={DETAIL_LABEL_CLASS_NAME}>{label}</dt>
          <dd className="mt-1 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
