"use client";

import type { ReactElement } from "react";

import { CircleAlertIcon, DownloadIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";
import { Badge } from "@common/components/ui/badge";
import { Button } from "@common/components/ui/button";

import type { AcademicScope } from "@features/academic/utils/academic-scope.util";
import { DocumentFilePreview } from "@features/enrollment-applications/components/document-file-preview";
import { DOCUMENT_STATUS_LABELS } from "@features/enrollment-applications/constants/documentation.constants";
import type { DocumentDelivery } from "@features/enrollment-applications/types/document-delivery.types";
import { formatEnrollmentApplicationDateTime } from "@features/enrollment-applications/utils/enrollment-application-date.util";
import { getAttachmentDownloadUrl } from "@features/enrollment-applications/utils/enrollment-application.util";

export function Delivery({
  file,
  applicationId,
  scope,
  showReviewStatus = false,
}: {
  file: DocumentDelivery;
  applicationId: string;
  scope: AcademicScope;
  showReviewStatus?: boolean;
}): ReactElement {
  return (
    <div className="@container/delivery min-w-0 space-y-3 text-sm">
      <div className="flex min-w-0 items-center gap-3">
        <p className="min-w-0 flex-1 font-medium break-all">{file.originalFileName}</p>
        <Button asChild variant="ghost" size="icon-lg" className="size-11 shrink-0">
          <a
            href={getAttachmentDownloadUrl(applicationId, file.id, scope)}
            target="_blank"
            rel="noreferrer"
            aria-label={`Descargar ${file.originalFileName}`}
            title="Descargar archivo"
          >
            <DownloadIcon aria-hidden="true" />
          </a>
        </Button>
      </div>
      <div className="grid items-start gap-4 @md/delivery:grid-cols-[12rem_minmax(0,1fr)]">
        <DocumentFilePreview
          key={file.id}
          src={getAttachmentDownloadUrl(applicationId, file.id, scope)}
          name={file.originalFileName}
          contentType={file.contentType}
        />
        <div className="min-w-0 space-y-4">
          <dl className="grid gap-3 text-sm">
            <div className="min-w-0 space-y-1">
              <dt className="text-muted-foreground text-xs">Presentado el</dt>
              <dd>
                <time dateTime={file.createdAt}>{formatEnrollmentApplicationDateTime(file.createdAt)}</time>
              </dd>
            </div>
            {showReviewStatus ? (
              <div className="min-w-0 space-y-1">
                <dt className="text-muted-foreground text-xs">Estado de revisión</dt>
                <dd>
                  <Badge variant="secondary">{DOCUMENT_STATUS_LABELS[file.reviewStatus]}</Badge>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
      {file.reviewedAt ? (
        <dl className="grid gap-3 text-sm @sm/delivery:grid-cols-2">
          <div className="min-w-0 space-y-1">
            <dt className="text-muted-foreground text-xs">Revisado el</dt>
            <dd>
              <time dateTime={file.reviewedAt}>{formatEnrollmentApplicationDateTime(file.reviewedAt)}</time>
            </dd>
          </div>
          <div className="min-w-0 space-y-1">
            <dt className="text-muted-foreground text-xs">Revisado por</dt>
            <dd>{file.reviewerType === "PLATFORM" ? "Administración de plataforma" : "Personal institucional"}</dd>
          </div>
        </dl>
      ) : null}
      {file.observation ? (
        <Alert variant={file.reviewStatus === "OBSERVED" ? "destructive" : "default"}>
          <CircleAlertIcon />
          <AlertTitle>Observación de la revisión</AlertTitle>
          <AlertDescription className="break-words whitespace-pre-wrap">{file.observation}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
