"use client";

import type { ReactElement } from "react";

import { Skeleton } from "@common/components/ui/skeleton";
import { TableCell, TableRow } from "@common/components/ui/table";

import type { CourseEnrollmentGradeHistoryEvent } from "@features/course-enrollments/types/course-enrollment-grade-history-event.types";
import { formatGradeValue } from "@features/course-enrollments/utils/course-enrollment-grade-format.util";
import { formatEnrollmentApplicationDateTime } from "@features/enrollment-applications/utils/enrollment-application-date.util";

const OPERATION_LABELS: Record<string, string> = {
  CREATED: "Nota creada",
  UPDATED: "Nota editada",
  MARKED_FOR_DELETION: "Eliminación solicitada",
  CANCELLED_DELETION: "Eliminación deshecha",
  PUBLISHED: "Nota publicada",
  DELETED_DRAFT: "Borrador eliminado",
  DELETED_PUBLISHED: "Nota eliminada al publicar",
  DISCARDED_DRAFT_ON_EXIT: "Borrador descartado al finalizar la cursada",
  REVERTED_TO_PUBLISHED_ON_EXIT: "Cambios sin publicar descartados",
  BASELINE: "Estado inicial registrado",
};

function formatMaybeGrade(value?: number | string | null): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return formatGradeValue(value);
}

function resolveSnapshot(event: CourseEnrollmentGradeHistoryEvent): {
  value: string;
  evaluation: string;
} | null {
  if (
    event.operation === "PUBLISHED" ||
    event.operation === "DELETED_DRAFT" ||
    event.operation === "DELETED_PUBLISHED" ||
    event.operation === "DISCARDED_DRAFT_ON_EXIT" ||
    event.operation === "MARKED_FOR_DELETION" ||
    event.operation === "CANCELLED_DELETION"
  ) {
    return null;
  }

  return {
    value: formatMaybeGrade(event.valueAfter) ?? formatMaybeGrade(event.publishedValueAfter) ?? "—",
    evaluation: event.evaluationAfter ?? "—",
  };
}

function resolveActorName(event: CourseEnrollmentGradeHistoryEvent): string {
  if (event.actor?.fullName) {
    return event.actor.fullName;
  }

  if (event.operation === "DISCARDED_DRAFT_ON_EXIT" || event.operation === "REVERTED_TO_PUBLISHED_ON_EXIT") {
    return "Sistema";
  }

  return "—";
}

export function CourseEnrollmentGradeHistoryRow({ event }: { event: CourseEnrollmentGradeHistoryEvent }): ReactElement {
  const snapshot = resolveSnapshot(event);

  return (
    <TableRow className="h-12">
      <TableCell className="tabular-nums">
        <time dateTime={event.changedAt}>{formatEnrollmentApplicationDateTime(event.changedAt)}</time>
      </TableCell>
      <TableCell>{OPERATION_LABELS[event.operation] ?? event.operation}</TableCell>
      <TableCell>
        {snapshot ? (
          <>
            <span className="block text-base font-semibold tabular-nums">{snapshot.value}</span>
            <span className="text-muted-foreground block text-xs">{snapshot.evaluation}</span>
          </>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell>{resolveActorName(event)}</TableCell>
    </TableRow>
  );
}

export function GradeHistorySkeleton(): ReactElement {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Cargando historial">
      <span className="sr-only" role="status">
        Cargando historial…
      </span>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-baseline justify-between gap-4 px-1 py-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-48" />
        </div>
      ))}
    </div>
  );
}
