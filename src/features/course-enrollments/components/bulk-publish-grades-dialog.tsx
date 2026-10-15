"use client";

import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import { CircleAlertIcon, ScrollTextIcon } from "lucide-react";

import { Alert, AlertDescription } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@common/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@common/components/ui/empty";
import { Skeleton } from "@common/components/ui/skeleton";

import { BulkPublishGradesForm } from "@features/course-enrollments/components/bulk-publish-grades-form";
import { fetchPendingClassesClient } from "@features/course-enrollments/services/pending-class-grades-client.service";
import type { PendingClassGrades } from "@features/course-enrollments/types/pending-class-grades.types";

type BulkPublishGradesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished: () => void;
};

export function BulkPublishGradesDialog({ open, onOpenChange, onPublished }: BulkPublishGradesDialogProps): ReactElement {
  const [classes, setClasses] = useState<PendingClassGrades[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    fetchPendingClassesClient()
      .then((data) => {
        if (!cancelled) {
          setClasses(data);
          setLoadError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("No se pudieron cargar las clases con cambios. Reintentá.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  async function handleRetry(): Promise<void> {
    setIsLoading(true);
    setLoadError(null);

    try {
      setClasses(await fetchPendingClassesClient());
    } catch {
      setClasses([]);
      setLoadError("No se pudieron cargar las clases con cambios. Reintentá.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenChange(next: boolean): void {
    if (isPublishing && !next) {
      return;
    }

    onOpenChange(next);
  }

  if (!open) {
    return <></>;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[calc(100%_-_2.5rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publicar notas</DialogTitle>
          <DialogDescription>Seleccioná el curso y la clase con cambios pendientes.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <>
            <div className="space-y-4" aria-busy="true" aria-label="Cargando clases con cambios">
              <span className="sr-only" role="status">
                Cargando clases con cambios…
              </span>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" size="lg" disabled>
                Publicar notas
              </Button>
            </DialogFooter>
          </>
        ) : null}
        {!isLoading && loadError ? (
          <>
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
            <DialogFooter>
              <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" size="lg" onClick={() => void handleRetry()}>
                Reintentar
              </Button>
            </DialogFooter>
          </>
        ) : null}
        {!isLoading && !loadError && classes.length === 0 ? (
          <>
            <Empty className="min-h-56 p-6">
              <EmptyHeader className="max-w-sm">
                <EmptyMedia variant="icon">
                  <ScrollTextIcon className="size-5" aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle className="text-base">Sin cambios pendientes</EmptyTitle>
                <EmptyDescription>No hay clases con cambios pendientes de notas para publicar.</EmptyDescription>
              </EmptyHeader>
            </Empty>
            <DialogFooter>
              <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" size="lg" disabled>
                Publicar notas
              </Button>
            </DialogFooter>
          </>
        ) : null}
        {!isLoading && !loadError && classes.length > 0 ? (
          <BulkPublishGradesForm
            key="bulk-form"
            classes={classes}
            onOpenChange={onOpenChange}
            onPublished={onPublished}
            onPendingChange={setIsPublishing}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
