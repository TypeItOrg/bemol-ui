"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";

import { CircleAlertIcon, ScrollTextIcon, SendIcon } from "lucide-react";

import { Alert, AlertDescription } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@common/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@common/components/ui/empty";
import { Skeleton } from "@common/components/ui/skeleton";

import { BulkPublishGradesForm } from "@features/course-enrollments/components/bulk-publish-grades-form";
import { fetchPendingClassesClient } from "@features/course-enrollments/services/pending-class-grades-client.service";
import type { PendingClassGrades } from "@features/course-enrollments/types/pending-class-grades.types";

const LOAD_ERROR = "No se pudieron cargar las clases con cambios. Reintentá.";

const REFRESH_ERROR = "No se pudieron actualizar las clases con cambios. Reintentá.";

type BulkPublishGradesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished: () => void;
};

type PendingClassesOutcome = { status: "ok"; classes: PendingClassGrades[] } | { status: "stale" } | { status: "error" };

function BulkPublishDialogContent({ onOpenChange, onPublished }: Omit<BulkPublishGradesDialogProps, "open">): ReactElement {
  const [classes, setClasses] = useState<PendingClassGrades[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const [hasReport, setHasReport] = useState(false);

  const [isPublishing, setIsPublishing] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [refreshError, setRefreshError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  useEffect(() => {
    let active = true;

    void fetchPendingClassesClient()
      .then((data) => {
        if (active) {
          setClasses(data);
          setLoadError(null);
        }
      })
      .catch(() => {
        if (active) {
          setLoadError(LOAD_ERROR);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function loadPendingClasses(): Promise<PendingClassesOutcome> {
    const requestId = requestIdRef.current + 1;

    requestIdRef.current = requestId;

    try {
      const data = await fetchPendingClassesClient();

      return requestIdRef.current === requestId ? { status: "ok", classes: data } : { status: "stale" };
    } catch {
      return requestIdRef.current === requestId ? { status: "error" } : { status: "stale" };
    }
  }

  async function handleRetry(): Promise<void> {
    setIsLoading(true);
    setLoadError(null);

    const outcome = await loadPendingClasses();

    if (outcome.status === "stale") {
      return;
    }

    if (outcome.status === "ok") {
      setClasses(outcome.classes);
    } else {
      setClasses([]);
      setLoadError(LOAD_ERROR);
    }

    setIsLoading(false);
  }

  async function handleRefreshPendingClasses(): Promise<void> {
    setIsRefreshing(true);
    setRefreshError(null);

    const outcome = await loadPendingClasses();

    if (outcome.status === "stale") {
      return;
    }

    if (outcome.status === "ok") {
      setClasses(outcome.classes);
    } else {
      setRefreshError(REFRESH_ERROR);
    }

    setIsRefreshing(false);
  }

  function handleOpenChange(next: boolean): void {
    if (isPublishing && !next) {
      return;
    }

    onOpenChange(next);
  }

  const showForm = !isLoading && !loadError && (classes.length > 0 || hasReport);

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-5 overflow-hidden sm:max-w-md"
        onInteractOutside={(event) => {
          if (isPublishing) {
            event.preventDefault();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (isPublishing) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader className="shrink-0 items-center pt-2 text-center">
          <div className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl">
            <SendIcon className="size-6" aria-hidden="true" />
          </div>
          <DialogTitle className="leading-snug font-semibold">Publicar notas</DialogTitle>
          <DialogDescription className="max-w-sm leading-relaxed text-balance">
            Elegí el curso y la clase que querés publicar para que los estudiantes puedan ver sus calificaciones actualizadas.
          </DialogDescription>
        </DialogHeader>
        {showForm ? (
          <BulkPublishGradesForm
            classes={classes}
            isRefreshing={isRefreshing}
            refreshError={refreshError}
            onRefreshPendingClasses={() => void handleRefreshPendingClasses()}
            onOpenChange={onOpenChange}
            onPublished={onPublished}
            onPendingChange={setIsPublishing}
            onReportAvailable={() => setHasReport(true)}
          />
        ) : (
          <>
            <div className="-mx-4 min-h-0 flex-1 overflow-y-auto px-4">
              {isLoading ? (
                <div className="space-y-4" aria-busy="true" aria-label="Cargando clases con cambios">
                  <span className="sr-only" role="status">
                    Cargando clases con cambios…
                  </span>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              ) : null}
              {!isLoading && loadError ? (
                <Alert variant="destructive">
                  <CircleAlertIcon />
                  <AlertDescription>{loadError}</AlertDescription>
                </Alert>
              ) : null}
              {!isLoading && !loadError ? (
                <Empty className="min-h-56 p-6">
                  <EmptyHeader className="max-w-sm">
                    <EmptyMedia variant="icon">
                      <ScrollTextIcon className="size-5" aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle className="text-base">Sin cambios pendientes</EmptyTitle>
                    <EmptyDescription>No hay clases con cambios pendientes de notas para publicar.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : null}
            </div>
            <DialogFooter className="shrink-0">
              <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              {loadError ? (
                <Button type="button" size="lg" onClick={() => void handleRetry()}>
                  Reintentar
                </Button>
              ) : (
                <Button type="button" size="lg" disabled>
                  Publicar notas
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function BulkPublishGradesDialog({ open, onOpenChange, onPublished }: BulkPublishGradesDialogProps): ReactElement {
  if (!open) {
    return <></>;
  }

  return <BulkPublishDialogContent onOpenChange={onOpenChange} onPublished={onPublished} />;
}
