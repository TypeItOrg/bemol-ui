"use client";

import { useEffect } from "react";
import type { ReactElement } from "react";

import { useQuery } from "@tanstack/react-query";
import { CircleAlertIcon } from "lucide-react";

import { Alert, AlertDescription } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";

import { CourseEnrollmentDeletedGradeItem } from "@features/course-enrollments/components/course-enrollment-deleted-grade-item";
import { CourseEnrollmentGradeListItem } from "@features/course-enrollments/components/course-enrollment-grade-list-item";
import { GradeListEmpty, GradeListSkeleton } from "@features/course-enrollments/components/course-enrollment-grade-list-states";
import { COURSE_ENROLLMENT_GRADE_MESSAGES } from "@features/course-enrollments/constants/course-enrollment-grade.constants";
import {
  fetchManagementGradesClient,
  fetchTeacherGradesClient,
  GRADE_MANAGEMENT_MODE,
  type GradeManagementMode,
} from "@features/course-enrollments/services/course-enrollment-grade-client.service";
import {
  fetchManagementArchivedGradesClient,
  fetchTeacherArchivedGradesClient,
} from "@features/course-enrollments/services/course-enrollment-grade-history-client.service";
import type { CourseEnrollmentGrade } from "@features/course-enrollments/types/course-enrollment-grade.types";
import { gradeQueryKeys } from "@features/course-enrollments/utils/course-enrollment-grade-query-keys.util";

type GradesBodyProps = {
  mode: GradeManagementMode;
  enrollmentId: string;
  classId?: string;
  variant: "inline" | "dialog";
  canUpdate: boolean;
  canDelete: boolean;
  canEdit: boolean;
  onEdit: (grade: CourseEnrollmentGrade) => void;
  onDelete: (grade: CourseEnrollmentGrade) => void;
  onHistory: (gradeId: string, label: string) => void;
  onCancelDeletion: (grade: CourseEnrollmentGrade) => void;
  onErrorChange?: (hasError: boolean) => void;
  onLoadingChange?: (isLoading: boolean) => void;
};

export function CourseEnrollmentGradesBody({
  mode,
  enrollmentId,
  classId,
  variant,
  canUpdate,
  canDelete,
  canEdit,
  onEdit,
  onDelete,
  onHistory,
  onCancelDeletion,
  onErrorChange,
  onLoadingChange,
}: GradesBodyProps): ReactElement {
  const isTeacherMode = mode === GRADE_MANAGEMENT_MODE.TEACHER;

  const missingTeacherClass = isTeacherMode && !classId;

  const gradesQuery = useQuery({
    queryKey: gradeQueryKeys.enrollment(mode, enrollmentId, classId),
    queryFn: ({ signal }) => {
      if (isTeacherMode) {
        if (!classId) {
          throw new Error("Falta la clase.");
        }

        return fetchTeacherGradesClient(classId, enrollmentId, signal);
      }

      return fetchManagementGradesClient(enrollmentId, signal);
    },
    enabled: !missingTeacherClass,
    retry: false,
    meta: { refreshOnReturn: true },
  });

  const archivedQuery = useQuery({
    queryKey: gradeQueryKeys.archived(mode, enrollmentId, classId),
    queryFn: ({ signal }) => {
      if (isTeacherMode) {
        if (!classId) {
          throw new Error("Falta la clase.");
        }

        return fetchTeacherArchivedGradesClient(classId, enrollmentId, signal);
      }

      return fetchManagementArchivedGradesClient(enrollmentId, signal);
    },
    enabled: !missingTeacherClass,
    retry: false,
    meta: { refreshOnReturn: true },
  });

  const isLoading = !missingTeacherClass && (gradesQuery.isPending || (gradesQuery.isFetching && gradesQuery.isError));

  const hasError = missingTeacherClass || (gradesQuery.isError && !gradesQuery.isFetching);

  useEffect(() => {
    onErrorChange?.(hasError);
  }, [hasError, onErrorChange]);

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  function handleRetry(): void {
    void gradesQuery.refetch();
    void archivedQuery.refetch();
  }

  if (isLoading) {
    return <GradeListSkeleton />;
  }

  if (hasError) {
    if (variant === "dialog") {
      return (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{COURSE_ENROLLMENT_GRADE_MESSAGES.LOAD_FAILED}</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{COURSE_ENROLLMENT_GRADE_MESSAGES.LOAD_FAILED}</AlertDescription>
        </Alert>
        <div className="flex justify-end gap-2">
          <Button type="button" size="lg" onClick={handleRetry}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const grades = gradesQuery.data ?? [];

  const archived = archivedQuery.data ?? [];

  if (grades.length === 0 && archived.length === 0) {
    return <GradeListEmpty isClosed={!canEdit} />;
  }

  return (
    <ul
      className={
        variant === "dialog"
          ? "bg-background max-h-[50dvh] divide-y overflow-y-auto rounded-lg border sm:max-h-96"
          : "bg-background divide-y overflow-hidden rounded-lg border"
      }
    >
      {grades.map((grade) => (
        <CourseEnrollmentGradeListItem
          key={grade.id}
          grade={grade}
          canUpdate={canUpdate}
          canDelete={canDelete}
          canEdit={canEdit}
          onEdit={onEdit}
          onDelete={onDelete}
          onCancelDeletion={onCancelDeletion}
          onViewHistory={(item) => onHistory(item.id, item.evaluation)}
        />
      ))}
      {archived.map((grade) => (
        <CourseEnrollmentDeletedGradeItem key={grade.gradeId} grade={grade} onViewHistory={onHistory} />
      ))}
    </ul>
  );
}
