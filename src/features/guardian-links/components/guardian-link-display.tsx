import type { ReactElement } from "react";

import { EyeIcon, FileTextIcon } from "lucide-react";

import { OptionalValue } from "@common/components/optional-value";
import { Badge } from "@common/components/ui/badge";
import { Button } from "@common/components/ui/button";
import { FileUploadSelection } from "@common/components/ui/file-upload-selection";

import { DocumentFilePreview } from "@features/enrollment-applications/components/document-file-preview";
import { calculateAge } from "@features/enrollment-applications/schemas/enrollment-application.schema";
import { formatEnrollmentApplicationDateTime } from "@features/enrollment-applications/utils/enrollment-application-date.util";
import { GUARDIAN_LINK_STATUS, type GuardianLinkStatus } from "@features/guardian-dependents/types/guardian-link-status.types";
import { getGuardianDependentName } from "@features/guardian-dependents/utils/guardian-dependent-display.util";
import {
  getGuardianLinkAttachmentContentPath,
  getPlatformGuardianLinkAttachmentContentPath,
} from "@features/guardian-links/constants/guardian-link.constants";
import type { GuardianLinkPerson } from "@features/guardian-links/types/guardian-link-person.types";
import type { GuardianLinkRequest } from "@features/guardian-links/types/guardian-link-request.types";

const STATUS_LABELS: Record<string, string> = {
  ALL: "Todos los estados",
  PENDING: "Pendiente",
  ACTIVE: "Aceptada",
  REJECTED: "Rechazada",
  ENDED: "Finalizada",
};

export function RequestAttachments({
  request,
  institutionId,
  attachmentPathMode,
  detailed = false,
}: { institutionId?: string; attachmentPathMode?: "institutional" | "platform"; detailed?: boolean } & {
  request: GuardianLinkRequest;
}): ReactElement {
  const getAttachmentPath =
    attachmentPathMode === "platform"
      ? getPlatformGuardianLinkAttachmentContentPath
      : (_institutionId: string, linkId: string, attachmentId: string) => getGuardianLinkAttachmentContentPath(linkId, attachmentId);

  if (detailed) {
    return (
      <div className="space-y-3">
        {request.attachments.map((attachment) => {
          const src = getAttachmentPath(request.institution?.institutionId ?? institutionId ?? "", request.personGuardianId, attachment.id);

          return (
            <FileUploadSelection
              key={attachment.id}
              label="Archivo adjunto"
              name={attachment.originalFileName}
              statusLabel={`Adjuntado el ${formatEnrollmentApplicationDateTime(attachment.createdAt)}`}
              preview={<DocumentFilePreview src={src} name={attachment.originalFileName} contentType={attachment.contentType} compact />}
              previewAction={<DocumentFilePreview src={src} name={attachment.originalFileName} contentType={attachment.contentType} iconOnly />}
            />
          );
        })}
      </div>
    );
  }

  return (
    <OptionalValue
      value={
        request.attachments.length > 0 ? (
          <div className="flex w-56 max-w-full flex-col gap-1.5">
            {request.attachments.map((attachment) => (
              <DocumentFilePreview
                key={attachment.id}
                src={getAttachmentPath(request.institution?.institutionId ?? institutionId ?? "", request.personGuardianId, attachment.id)}
                name={attachment.originalFileName}
                contentType={attachment.contentType}
                trigger={
                  <Button
                    aria-label={`Ver ${attachment.originalFileName}`}
                    className="w-full min-w-0 justify-start gap-2"
                    size="sm"
                    title={attachment.originalFileName}
                    type="button"
                    variant="outline"
                  >
                    <FileTextIcon aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate text-left">{attachment.originalFileName}</span>
                    <EyeIcon aria-hidden="true" className="text-muted-foreground size-3.5 shrink-0" />
                  </Button>
                }
              />
            ))}
          </div>
        ) : null
      }
      fallback="Sin documentación"
    />
  );
}

export function RequestStatus({ status, className }: { status: GuardianLinkStatus; className?: string }): ReactElement {
  const defaultVariant = status === GUARDIAN_LINK_STATUS.ACTIVE ? "success" : "secondary";

  return (
    <Badge size="lg" className={className} variant={status === GUARDIAN_LINK_STATUS.REJECTED ? "destructive" : defaultVariant}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function PersonCell({ person }: { person: GuardianLinkPerson }): ReactElement {
  return (
    <div>
      <div className="font-medium">{getGuardianDependentName(person)}</div>
      <div className="text-muted-foreground text-xs">
        {person.documentNumber}
        {person.birthDate ? ` · ${formatAge(person.birthDate)}` : null}
      </div>
    </div>
  );
}

function formatAge(birthDate: string | null): string {
  const age = calculateAge(birthDate ?? undefined);

  return age === null ? "Edad no disponible" : `${age} años`;
}
