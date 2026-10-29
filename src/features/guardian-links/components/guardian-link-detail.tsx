"use client";

import { useState, type ReactElement } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ClipboardCheckIcon, ClipboardListIcon, FileTextIcon, UsersIcon } from "lucide-react";

import { OptionalValue } from "@common/components/optional-value";
import { SectionHeader } from "@common/components/section-header";
import { Badge } from "@common/components/ui/badge";
import { Button } from "@common/components/ui/button";
import { DETAIL_LABEL_CLASS_NAME } from "@common/constants/detail-label.constants";
import { formatDisplayDate } from "@common/utils/date-input.util";

import { calculateAge } from "@features/enrollment-applications/schemas/enrollment-application.schema";
import { formatEnrollmentApplicationDateTime } from "@features/enrollment-applications/utils/enrollment-application-date.util";
import { GUARDIAN_RELATIONSHIP_LABELS } from "@features/guardian-dependents/constants/guardian-dependent.constants";
import { GUARDIAN_LINK_STATUS } from "@features/guardian-dependents/types/guardian-link-status.types";
import { GUARDIAN_RELATIONSHIP } from "@features/guardian-dependents/types/guardian-relationship.types";
import { resolveGuardianLinkAction } from "@features/guardian-links/actions/resolve-guardian-link.action";
import { resolvePlatformGuardianLinkAction } from "@features/guardian-links/actions/resolve-platform-guardian-link.action";
import { ApproveGuardianLinkDialog } from "@features/guardian-links/components/approve-guardian-link-dialog";
import { RequestAttachments, RequestStatus } from "@features/guardian-links/components/guardian-link-display";
import { RejectGuardianLinkDialog } from "@features/guardian-links/components/reject-guardian-link-dialog";
import type { GuardianLinkPerson } from "@features/guardian-links/types/guardian-link-person.types";
import type { GuardianLinkRequest } from "@features/guardian-links/types/guardian-link-request.types";
import { getGuardianLinkApprovalError, getGuardianLinkReviewPerson } from "@features/guardian-links/utils/guardian-link-review.util";

const REPRESENTED_RELATIONSHIP_LABELS = {
  [GUARDIAN_RELATIONSHIP.MOTHER]: "Hijo/a",
  [GUARDIAN_RELATIONSHIP.FATHER]: "Hijo/a",
  [GUARDIAN_RELATIONSHIP.LEGAL_GUARDIAN]: "Persona bajo tutela",
  [GUARDIAN_RELATIONSHIP.OTHER]: undefined,
};

export function GuardianLinkDetail({
  request,
  institutionId,
  returnTo,
  platform = false,
}: {
  request: GuardianLinkRequest;
  institutionId?: string;
  returnTo: string;
  platform?: boolean;
}): ReactElement {
  const router = useRouter();

  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);

  const onResolve = platform ? resolvePlatformGuardianLinkAction : resolveGuardianLinkAction;

  const attachmentPathMode = platform ? "platform" : "institutional";

  const approvalError = getGuardianLinkApprovalError(request);

  function onSuccess(): void {
    setDecision(null);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="outline" size="lg">
          <Link href={returnTo}>Volver</Link>
        </Button>
        {request.status === GUARDIAN_LINK_STATUS.PENDING ? (
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:flex sm:flex-wrap">
            <Button className="w-full sm:w-auto" size="lg" type="button" variant="destructive" onClick={() => setDecision("reject")}>
              Rechazar
            </Button>
            <Button className="w-full sm:w-auto" disabled={Boolean(approvalError)} size="lg" type="button" onClick={() => setDecision("approve")}>
              Aceptar vinculación
            </Button>
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-4">
        <section className="bg-muted/25 space-y-5 rounded-xl border p-4 sm:p-5">
          <header className="flex items-center justify-between gap-4">
            <SectionHeader
              icon={ClipboardCheckIcon}
              title="Estado de la solicitud"
              description={formatEnrollmentApplicationDateTime(request.createdAt)}
              descriptionBreakpoint="sm"
            />
            <RequestStatus status={request.status} />
          </header>
          {approvalError ? <p className="text-muted-foreground text-sm">{approvalError}</p> : null}
          {request.resolvedAt ? (
            <dl className="pt-4">
              <div className="space-y-1">
                <dt className={DETAIL_LABEL_CLASS_NAME}>Fecha de resolución</dt>
                <dd className="text-sm">{formatEnrollmentApplicationDateTime(request.resolvedAt)}</dd>
              </div>
            </dl>
          ) : null}
        </section>
        <section className="bg-muted/25 space-y-5 rounded-xl border p-4 sm:p-5">
          <header className="pb-1">
            <SectionHeader icon={UsersIcon} title="Datos de la vinculación" description="Personas vinculadas y relación entre ellas." />
          </header>
          <div className="grid gap-5 md:grid-cols-2 md:gap-6">
            {platform ? (
              <section className="bg-background col-span-full min-w-0 space-y-1 rounded-xl border p-4 sm:p-5" aria-label="Institución">
                <div className="flex min-h-5 items-center">
                  <h3 className={DETAIL_LABEL_CLASS_NAME}>Institución</h3>
                </div>
                <p className="text-lg leading-snug font-semibold break-words">
                  <OptionalValue value={request.institution?.name} fallback="Sin institución" />
                </p>
              </section>
            ) : null}
            <PersonDetails title="Representante" person={request.tutor} relationship={GUARDIAN_RELATIONSHIP_LABELS[request.relationship]} />
            <PersonDetails
              title="Persona representada"
              person={getGuardianLinkReviewPerson(request)}
              relationship={REPRESENTED_RELATIONSHIP_LABELS[request.relationship]}
            />
          </div>
        </section>
        {request.declaredFirstName || request.declaredLastName || request.declaredBirthDate ? (
          <section className="bg-muted/25 space-y-5 rounded-xl border p-4 sm:p-5" aria-label="Datos declarados en la solicitud">
            <SectionHeader
              icon={ClipboardListIcon}
              title="Datos declarados en la solicitud"
              description="Comparalos con los datos registrados antes de aceptar la vinculación."
            />
            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="min-w-0">
                <dt className={DETAIL_LABEL_CLASS_NAME}>Nombre</dt>
                <dd className="mt-1 text-sm break-words">
                  <OptionalValue value={request.declaredFirstName} fallback="No declarado" />
                </dd>
              </div>
              <div className="min-w-0">
                <dt className={DETAIL_LABEL_CLASS_NAME}>Apellido</dt>
                <dd className="mt-1 text-sm break-words">
                  <OptionalValue value={request.declaredLastName} fallback="No declarado" />
                </dd>
              </div>
              <div>
                <dt className={DETAIL_LABEL_CLASS_NAME}>Fecha de nacimiento</dt>
                <dd className="mt-1 text-sm tabular-nums">{formatDisplayDate(request.declaredBirthDate, "No declarada")}</dd>
              </div>
            </dl>
          </section>
        ) : null}
        {request.attachments.length > 0 ? (
          <section className="bg-muted/25 space-y-5 rounded-xl border p-4 sm:p-5" aria-label="Documentación de la vinculación">
            <header className="pb-1">
              <SectionHeader icon={FileTextIcon} title="Documentación" description="Archivos adjuntos para revisar la vinculación." />
            </header>
            <RequestAttachments request={request} institutionId={institutionId} attachmentPathMode={attachmentPathMode} detailed />
          </section>
        ) : null}
      </div>
      {decision === "approve" ? (
        <ApproveGuardianLinkDialog
          request={request}
          institutionId={institutionId}
          onResolve={onResolve}
          onClose={() => setDecision(null)}
          onApproved={onSuccess}
        />
      ) : null}
      {decision === "reject" ? (
        <RejectGuardianLinkDialog
          request={request}
          institutionId={institutionId}
          onResolve={onResolve}
          onClose={() => setDecision(null)}
          onRejected={onSuccess}
        />
      ) : null}
    </>
  );
}

function PersonDetails({ title, person, relationship }: { title: string; person: GuardianLinkPerson; relationship?: string }): ReactElement {
  const age = calculateAge(person.birthDate ?? undefined);

  return (
    <section className="bg-background min-w-0 space-y-3 rounded-xl border p-4 sm:p-5" aria-label={title}>
      <div className="space-y-1">
        <div className="flex min-h-5 flex-wrap items-center gap-2">
          <h3 className={DETAIL_LABEL_CLASS_NAME}>{title}</h3>
          {relationship ? (
            <Badge variant="secondary" aria-label={`Vínculo: ${relationship}`}>
              {relationship}
            </Badge>
          ) : null}
        </div>
        <p className="text-lg leading-snug font-semibold break-words">
          {person.firstName} {person.lastName}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className={DETAIL_LABEL_CLASS_NAME}>Documento</dt>
          <dd className="mt-1 text-sm font-medium tabular-nums">{person.documentNumber}</dd>
        </div>
        <div>
          <dt className={DETAIL_LABEL_CLASS_NAME}>Edad</dt>
          <dd className="mt-1 text-sm font-medium">
            <OptionalValue value={age === null ? null : `${age} ${age === 1 ? "año" : "años"}`} fallback="Edad no informada" />
          </dd>
        </div>
      </dl>
    </section>
  );
}
