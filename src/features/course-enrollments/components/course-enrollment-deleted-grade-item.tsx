"use client";

import type { ReactElement } from "react";

import { HistoryIcon } from "lucide-react";

import { Badge } from "@common/components/ui/badge";
import { Button } from "@common/components/ui/button";

import type { CourseEnrollmentArchivedGrade } from "@features/course-enrollments/types/course-enrollment-archived-grade.types";
import { formatGradeValue } from "@features/course-enrollments/utils/course-enrollment-grade-format.util";

type DeletedGradeItemProps = {
  grade: CourseEnrollmentArchivedGrade;
  onViewHistory: (gradeId: string, label: string) => void;
};

export function CourseEnrollmentDeletedGradeItem({ grade, onViewHistory }: DeletedGradeItemProps): ReactElement {
  const isDiscardedDraft = grade.deletionType === "DISCARDED_DRAFT_ON_EXIT";

  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2.5 opacity-70">
      <p className="min-w-0 font-semibold wrap-break-word">{grade.lastEvaluation}</p>
      <div className="flex shrink-0 items-center gap-1.5">
        {isDiscardedDraft ? <Badge variant="secondary">Borrador descartado</Badge> : <Badge variant="destructive">Eliminada</Badge>}
        <span className="bg-muted rounded-md px-3 py-1.5 text-lg font-semibold tabular-nums">
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
