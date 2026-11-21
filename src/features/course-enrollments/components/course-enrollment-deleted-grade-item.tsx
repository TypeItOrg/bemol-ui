"use client";

import type { ReactElement } from "react";

import { HistoryIcon } from "lucide-react";

import { Badge } from "@common/components/ui/badge";
import { Button } from "@common/components/ui/button";

import type { CourseEnrollmentArchivedGrade } from "@features/course-enrollments/types/course-enrollment-archived-grade.types";
import { COURSE_ENROLLMENT_GRADE_HISTORY_ACTION } from "@features/course-enrollments/types/course-enrollment-grade-history-action.types";
import { formatGradeValue } from "@features/course-enrollments/utils/course-enrollment-grade-format.util";

type DeletedGradeItemProps = {
  grade: CourseEnrollmentArchivedGrade;
  onViewHistory: (gradeId: string, label: string) => void;
};

export function CourseEnrollmentDeletedGradeItem({ grade, onViewHistory }: DeletedGradeItemProps): ReactElement {
  const isDiscardedDraft = grade.deletionType === COURSE_ENROLLMENT_GRADE_HISTORY_ACTION.DISCARDED_DRAFT_ON_EXIT;

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 px-3.5 py-3 opacity-70 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="contents sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-between sm:gap-3">
        <p className="min-w-0 font-semibold wrap-break-word">{grade.lastEvaluation}</p>
        <div className="col-span-2 row-start-2">
          {isDiscardedDraft ? (
            <Badge variant="secondary" size="lg">
              Borrador descartado
            </Badge>
          ) : (
            <Badge variant="destructive" size="lg">
              Eliminada
            </Badge>
          )}
        </div>
      </div>
      <div className="col-start-2 row-start-1 flex shrink-0 items-center gap-2">
        <span className="bg-muted inline-flex h-8 min-w-12 items-center justify-center rounded-md px-2.5 text-center text-base font-semibold tabular-nums">
          {grade.lastValue != null ? formatGradeValue(grade.lastValue) : "—"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Ver historial de ${grade.lastEvaluation}`}
          title="Ver historial"
          onClick={() => onViewHistory(grade.gradeId, grade.lastEvaluation)}
        >
          <HistoryIcon className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}
