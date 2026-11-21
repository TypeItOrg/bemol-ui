"use client";

import type { ReactElement } from "react";

import { EllipsisVerticalIcon, HistoryIcon, PencilIcon, Trash2Icon, Undo2Icon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@common/components/ui/dropdown-menu";

import { CourseEnrollmentGradeStatusBadge } from "@features/course-enrollments/components/course-enrollment-grade-status-badge";
import { COURSE_ENROLLMENT_GRADE_MESSAGES } from "@features/course-enrollments/constants/course-enrollment-grade.constants";
import { COURSE_ENROLLMENT_GRADE_STATUS } from "@features/course-enrollments/types/course-enrollment-grade-status.types";
import type { CourseEnrollmentGrade } from "@features/course-enrollments/types/course-enrollment-grade.types";
import { formatGradeValue } from "@features/course-enrollments/utils/course-enrollment-grade-format.util";

type GradeListItemProps = {
  grade: CourseEnrollmentGrade;
  canUpdate: boolean;
  canDelete: boolean;
  canEdit: boolean;
  onEdit: (grade: CourseEnrollmentGrade) => void;
  onDelete: (grade: CourseEnrollmentGrade) => void;
  onCancelDeletion: (grade: CourseEnrollmentGrade) => void;
  onViewHistory: (grade: CourseEnrollmentGrade) => void;
};

export function CourseEnrollmentGradeListItem({
  grade,
  canUpdate,
  canDelete,
  canEdit,
  onEdit,
  onDelete,
  onCancelDeletion,
  onViewHistory,
}: GradeListItemProps): ReactElement {
  const showPill = grade.publicationStatus !== COURSE_ENROLLMENT_GRADE_STATUS.PUBLISHED;

  const isPendingDeletion = grade.publicationStatus === COURSE_ENROLLMENT_GRADE_STATUS.PENDING_DELETION;

  const showEditAction = canUpdate && canEdit && !isPendingDeletion;

  const showDeleteAction = canDelete && canEdit && !isPendingDeletion;

  const showCancelDeletionAction = canDelete && canEdit && isPendingDeletion;

  const hasMutationActions = showEditAction || showDeleteAction || showCancelDeletionAction;

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 px-3.5 py-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="contents sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-between sm:gap-3">
        <p className="min-w-0 font-semibold wrap-break-word">{grade.evaluation}</p>
        {showPill ? (
          <div className="col-span-2 row-start-2">
            <CourseEnrollmentGradeStatusBadge status={grade.publicationStatus} />
          </div>
        ) : null}
      </div>
      <div className="col-start-2 row-start-1 flex shrink-0 items-center gap-2">
        <span className="bg-muted inline-flex h-8 min-w-12 items-center justify-center rounded-md px-2.5 text-center text-base font-semibold tabular-nums">
          {formatGradeValue(grade.value)}
        </span>
        {hasMutationActions ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Acciones de ${grade.evaluation}`}>
                <EllipsisVerticalIcon className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {showEditAction ? (
                <DropdownMenuItem onSelect={() => onEdit(grade)}>
                  <PencilIcon aria-hidden="true" />
                  Editar nota
                </DropdownMenuItem>
              ) : null}
              {showDeleteAction ? (
                <DropdownMenuItem variant="destructive" onSelect={() => onDelete(grade)}>
                  <Trash2Icon aria-hidden="true" />
                  Eliminar nota
                </DropdownMenuItem>
              ) : null}
              {showCancelDeletionAction ? (
                <DropdownMenuItem onSelect={() => onCancelDeletion(grade)}>
                  <Undo2Icon aria-hidden="true" />
                  {COURSE_ENROLLMENT_GRADE_MESSAGES.CANCEL_DELETION}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onSelect={() => onViewHistory(grade)}>
                <HistoryIcon aria-hidden="true" />
                Ver historial
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Ver historial de ${grade.evaluation}`}
            title="Ver historial"
            onClick={() => onViewHistory(grade)}
          >
            <HistoryIcon className="size-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </li>
  );
}
