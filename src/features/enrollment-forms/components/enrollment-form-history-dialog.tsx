"use client";

import { useState, type ReactElement } from "react";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { HistoryIcon } from "lucide-react";

import { Badge } from "@common/components/ui/badge";
import { Button } from "@common/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@common/components/ui/dialog";
import type { PaginatedResponse } from "@common/types/paginated-response.types";

import { EnrollmentFormFeedback } from "@features/enrollment-forms/components/enrollment-form-feedback";
import { EnrollmentFormPagination } from "@features/enrollment-forms/components/enrollment-form-pagination";
import { ENROLLMENT_VERSION_LABELS } from "@features/enrollment-forms/constants/enrollment-form.constants";
import { enrollmentFormQueryKey } from "@features/enrollment-forms/hooks/use-enrollment-form-admin";
import { readEnrollmentFormResource } from "@features/enrollment-forms/services/enrollment-form-client.service";
import type { EnrollmentFormContext } from "@features/enrollment-forms/types/enrollment-form-context.types";
import type { EnrollmentFormVersionSummary } from "@features/enrollment-forms/types/enrollment-form-version-summary.types";
import { getEnrollmentFormVersionLabel } from "@features/enrollment-forms/utils/enrollment-form-version-label.util";

export function EnrollmentFormHistoryDialog({
  context,
  modelId,
  selectedVersionId,
  onClose,
  onSelectVersion,
}: {
  context: EnrollmentFormContext;
  modelId: string;
  selectedVersionId: string;
  onClose: () => void;
  onSelectVersion: (versionId: string) => void;
}): ReactElement {
  const [page, setPage] = useState(0);

  const [size, setSize] = useState(10);

  const path = `enrollment-forms/${modelId}/versions?page=${page}&size=${size}`;

  const versions = useQuery({
    queryKey: enrollmentFormQueryKey(context, path),
    queryFn: ({ signal }) =>
      readEnrollmentFormResource<PaginatedResponse<EnrollmentFormVersionSummary>>(context.scope, context.institutionId, path, signal),
    placeholderData: keepPreviousData,
    retryOnMount: false,
  });

  const loadError = versions.error ?? (!versions.data ? "No se pudo cargar el historial. Reintentá la consulta." : undefined);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent showCloseButton={false} className="flex max-h-[80dvh] flex-col gap-0 p-5">
        <DialogHeader className="shrink-0 items-center gap-1.5 text-center">
          <div className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl">
            <HistoryIcon aria-hidden="true" className="size-6" />
          </div>
          <DialogTitle className="text-center font-semibold">Versiones e historial</DialogTitle>
          <DialogDescription className="text-center text-balance">
            Las inscripciones existentes conservan la versión con la que se iniciaron.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-5 min-h-0 space-y-3 overflow-y-auto" aria-busy={versions.isFetching}>
          <EnrollmentFormFeedback error={loadError} />
          {loadError ? (
            <Button type="button" variant="outline" disabled={versions.isFetching} onClick={() => void versions.refetch()}>
              Reintentar carga
            </Button>
          ) : null}
          {versions.data?.totalItems === 0 ? <p className="text-muted-foreground">No hay versiones disponibles.</p> : null}
          {versions.data?.items.length ? (
            <ul className="space-y-2" aria-label="Versiones del formulario">
              {versions.data.items.map((item) => (
                <li key={item.id}>
                  <Button
                    type="button"
                    variant={item.id === selectedVersionId ? "secondary" : "outline"}
                    className="h-auto w-full items-start justify-between gap-4 px-4 py-3 text-left disabled:opacity-100"
                    disabled={versions.isPlaceholderData || item.id === selectedVersionId}
                    aria-current={item.id === selectedVersionId ? "true" : undefined}
                    onClick={() => onSelectVersion(item.id)}
                  >
                    <span className="min-w-0 space-y-1 whitespace-normal">
                      <span className="block">
                        {getEnrollmentFormVersionLabel(item.versionNumber)}
                        {item.id === selectedVersionId ? " · En pantalla" : ""}
                      </span>
                      {item.publishedAt ? (
                        <span className="text-muted-foreground block text-xs font-normal">
                          Publicada el {new Date(item.publishedAt).toLocaleString("es-AR")}
                        </span>
                      ) : null}
                      {item.archivedAt ? (
                        <span className="text-muted-foreground block text-xs font-normal">
                          Archivada el {new Date(item.archivedAt).toLocaleString("es-AR")}
                        </span>
                      ) : null}
                    </span>
                    <Badge variant="outline">{ENROLLMENT_VERSION_LABELS[item.status]}</Badge>
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
          {(versions.data?.totalPages ?? 0) > 1 ? (
            <EnrollmentFormPagination
              page={page}
              size={size}
              totalItems={versions.data?.totalItems}
              totalPages={versions.data?.totalPages}
              pending={versions.isFetching}
              onPage={setPage}
              onSize={(value) => {
                setSize(value);
                setPage(0);
              }}
            />
          ) : null}
        </div>
        <DialogFooter className="-mx-5 mt-5 -mb-5 shrink-0 p-3.5">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
