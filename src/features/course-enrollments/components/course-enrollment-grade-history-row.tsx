"use client";

import type { ReactElement } from "react";

import { Skeleton } from "@common/components/ui/skeleton";
import { TableCell, TableRow } from "@common/components/ui/table";

import {
  COURSE_ENROLLMENT_GRADE_HISTORY_ACTION,
  type CourseEnrollmentGradeHistoryAction,
} from "@features/course-enrollments/types/course-enrollment-grade-history-action.types";
import type { CourseEnrollmentGradeHistoryEvent } from "@features/course-enrollments/types/course-enrollment-grade-history-event.types";
import { formatGradeValue } from "@features/course-enrollments/utils/course-enrollment-grade-format.util";
import { formatEnrollmentApplicationDateTime } from "@features/enrollment-applications/utils/enrollment-application-date.util";

const OPERATION_LABELS: Record<CourseEnrollmentGradeHistoryAction, string> = {
  [COURSE_ENROLLMENT_GRADE_HISTORY_ACTION.CREATED]: "Nota creada",
  [COURSE_ENROLLMENT_GRADE_HISTORY_ACTION.UPDATED]: "Nota editada",
  [COURSE_ENROLLMENT_GRADE_HISTORY_ACTION.MARKED_FOR_DELETION]: "Eliminación solicitada",
  [COURSE_ENROLLMENT_GRADE_HISTORY_ACTION.CANCELLED_DELETION]: "Eliminación deshecha",
  [COURSE_ENROLLMENT_GRADE_HISTORY_ACTION.PUBLISHED]: "Nota publicada",
  [COURSE_ENROLLMENT_GRADE_HISTORY_ACTION.DELETED_DRAFT]: "Borrador eliminado",
  [COURSE_ENROLLMENT_GRADE_HISTORY_ACTION.DELETED_PUBLISHED]: "Nota eliminada al publicar",
  [COURSE_ENROLLMENT_GRADE_HISTORY_ACTION.DISCARDED_DRAFT_ON_EXIT]: "Borrador descartado al finalizar la cursada",
  [COURSE_ENROLLMENT_GRADE_HISTORY_ACTION.REVERTED_TO_PUBLISHED_ON_EXIT]: "Cambios sin publicar descartados",
  [COURSE_ENROLLMENT_GRADE_HISTORY_ACTION.BASELINE]: "Estado inicial registrado",
};

const SNAPSHOTLESS_OPERATIONS = new Set<CourseEnrollmentGradeHistoryAction>([
  COURSE_ENROLLMENT_GRADE_HISTORY_ACTION.PUBLISHED,
  COURSE_ENROLLMENT_GRADE_HISTORY_ACTION.DELETED_DRAFT,
  COURSE_ENROLLMENT_GRADE_HISTORY_ACTION.DELETED_PUBLISHED,
  COURSE_ENROLLMENT_GRADE_HISTORY_ACTION.DISCARDED_DRAFT_ON_EXIT,
  COURSE_ENROLLMENT_GRADE_HISTORY_ACTION.MARKED_FOR_DELETION,
  COURSE_ENROLLMENT_GRADE_HISTORY_ACTION.CANCELLED_DELETION,
]);

const SYSTEM_ACTOR_OPERATIONS = new Set<CourseEnrollmentGradeHistoryAction>([
  COURSE_ENROLLMENT_GRADE_HISTORY_ACTION.DISCARDED_DRAFT_ON_EXIT,
  COURSE_ENROLLMENT_GRADE_HISTORY_ACTION.REVERTED_TO_PUBLISHED_ON_EXIT,
]);

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
  if (SNAPSHOTLESS_OPERATIONS.has(event.operation)) {
    return null;
  }

  return {
    value: formatMaybeGrade(event.valueAfter) ?? formatMaybeGrade(event.publishedValueAfter) ?? "—",
    evaluation: event.evaluationAfter ?? event.publishedEvaluationAfter ?? "—",
  };
}

function resolveActorName(event: CourseEnrollmentGradeHistoryEvent): string {
  if (event.actor?.fullName) {
    return event.actor.fullName;
  }

  if (SYSTEM_ACTOR_OPERATIONS.has(event.operation)) {
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
