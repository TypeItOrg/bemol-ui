"use client";

import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import { CircleAlertIcon, HistoryIcon } from "lucide-react";

import { Alert, AlertDescription } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@common/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@common/components/ui/empty";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@common/components/ui/table";

import { CourseEnrollmentGradeHistoryRow, GradeHistorySkeleton } from "@features/course-enrollments/components/course-enrollment-grade-history-row";
import { COURSE_ENROLLMENT_GRADE_MESSAGES } from "@features/course-enrollments/constants/course-enrollment-grade.constants";
import {
  fetchManagementGradeHistoryClient,
  fetchTeacherGradeHistoryClient,
} from "@features/course-enrollments/services/course-enrollment-grade-history-client.service";
import type { CourseEnrollmentGradeHistoryEvent } from "@features/course-enrollments/types/course-enrollment-grade-history-event.types";

type GradeHistoryDialogProps = {
  mode: "institutional" | "teacher";
  enrollmentId: string;
  classId?: string;
  gradeId: string | null;
  gradeLabel?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CourseEnrollmentGradeHistoryDialog({
  mode,
  enrollmentId,
  classId,
  gradeId,
  gradeLabel,
  open,
  onOpenChange,
}: GradeHistoryDialogProps): ReactElement {
  const [events, setEvents] = useState<CourseEnrollmentGradeHistoryEvent[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !gradeId) {
      return;
    }

    let cancelled = false;

    const request =
      mode === "teacher" && classId
        ? fetchTeacherGradeHistoryClient(classId, enrollmentId, gradeId)
        : fetchManagementGradeHistoryClient(enrollmentId, gradeId);

    request
      .then((data) => {
        if (!cancelled) {
          setEvents(data);
          setLoadError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(COURSE_ENROLLMENT_GRADE_MESSAGES.LOAD_FAILED);
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
  }, [open, gradeId, mode, enrollmentId, classId]);

  async function handleRetry(): Promise<void> {
    if (!gradeId) {
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const data =
        mode === "teacher" && classId
          ? await fetchTeacherGradeHistoryClient(classId, enrollmentId, gradeId)
          : await fetchManagementGradeHistoryClient(enrollmentId, gradeId);

      setEvents(data);
    } catch {
      setEvents([]);
      setLoadError(COURSE_ENROLLMENT_GRADE_MESSAGES.LOAD_FAILED);
    } finally {
      setIsLoading(false);
    }
  }

  if (!open || !gradeId) {
    return <></>;
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100%_-_2.5rem)] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Historial de cambios</DialogTitle>
            <DialogDescription>Historial de la nota.</DialogDescription>
          </DialogHeader>
          <GradeHistorySkeleton />
          <DialogFooter>
            <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (loadError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100%_-_2.5rem)] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Historial de cambios</DialogTitle>
            <DialogDescription>Historial de la nota.</DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
          <DialogFooter>
            <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <Button type="button" size="lg" onClick={() => void handleRetry()}>
              Reintentar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (events.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100%_-_2.5rem)] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Historial de cambios</DialogTitle>
            <DialogDescription>Historial de la nota.</DialogDescription>
          </DialogHeader>
          <Empty className="min-h-48 p-6">
            <EmptyHeader className="max-w-sm">
              <EmptyMedia variant="icon">
                <HistoryIcon className="size-5" aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle className="text-base">Sin historial</EmptyTitle>
              <EmptyDescription>No hay cambios registrados para esta nota.</EmptyDescription>
            </EmptyHeader>
          </Empty>
          <DialogFooter>
            <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2.5rem)] max-w-[calc(100%_-_2.5rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Historial de cambios</DialogTitle>
          <DialogDescription>
            {gradeLabel ? `Historial de “${gradeLabel}”.` : "Historial de la nota."} Registro de operaciones y su estado resultante.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-background overflow-x-auto rounded-lg border">
          <Table className="min-w-150 sm:min-w-180">
            <TableHeader className="bg-muted">
              <TableRow className="h-11">
                <TableHead>Fecha y hora</TableHead>
                <TableHead>Operación</TableHead>
                <TableHead>Valores resultantes</TableHead>
                <TableHead>Autor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <CourseEnrollmentGradeHistoryRow key={event.historyId} event={event} />
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
