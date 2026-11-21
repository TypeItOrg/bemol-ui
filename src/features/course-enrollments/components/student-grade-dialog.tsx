"use client";

import type { ReactElement } from "react";

import { useParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { CircleAlertIcon, ScrollTextIcon } from "lucide-react";

import { Alert, AlertDescription } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@common/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@common/components/ui/empty";
import { Skeleton } from "@common/components/ui/skeleton";

import { COURSE_ENROLLMENT_GRADE_MESSAGES } from "@features/course-enrollments/constants/course-enrollment-grade.constants";
import { fetchStudentGradesClient } from "@features/course-enrollments/services/course-enrollment-grade-client.service";
import { COURSE_ENROLLMENT_STATUS } from "@features/course-enrollments/types/course-enrollment-status.types";
import type { CourseEnrollment } from "@features/course-enrollments/types/course-enrollment.types";
import { formatGradeValue } from "@features/course-enrollments/utils/course-enrollment-grade-format.util";
import { gradeQueryKeys } from "@features/course-enrollments/utils/course-enrollment-grade-query-keys.util";

type StudentGradeDialogProps = {
  enrollment: CourseEnrollment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function StudentGradeDialogContent({ enrollment, onOpenChange }: Omit<StudentGradeDialogProps, "open">): ReactElement {
  const params = useParams<{ personId?: string | string[] }>();

  const personId = typeof params?.personId === "string" ? params.personId : undefined;

  const isClosed = enrollment.status !== COURSE_ENROLLMENT_STATUS.ENROLLED;

  const gradesQuery = useQuery({
    queryKey: gradeQueryKeys.student(enrollment.id, personId),
    queryFn: ({ signal }) => fetchStudentGradesClient(enrollment.id, personId, signal),
    retry: false,
    staleTime: 0,
    gcTime: 0,
    meta: { refreshOnReturn: true },
  });

  const isLoading = gradesQuery.isFetching;

  const hasError = gradesQuery.isError && !gradesQuery.isFetching;

  const grades = gradesQuery.data ?? [];

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2.5rem)] max-w-[calc(100%_-_2.5rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{COURSE_ENROLLMENT_GRADE_MESSAGES.STUDENT_DIALOG_TITLE}</DialogTitle>
          <DialogDescription>
            {enrollment.academicSpaceName} · {enrollment.courseClassLabel}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2" aria-busy="true" aria-label="Cargando notas">
            <span className="sr-only" role="status">
              Cargando notas…
            </span>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-baseline justify-between gap-4 rounded-lg border px-3 py-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
        ) : null}
        {hasError ? (
          <>
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertDescription>{COURSE_ENROLLMENT_GRADE_MESSAGES.LOAD_FAILED}</AlertDescription>
            </Alert>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              <Button type="button" onClick={() => void gradesQuery.refetch()}>
                Reintentar
              </Button>
            </DialogFooter>
          </>
        ) : null}
        {!isLoading && !hasError && grades.length === 0 ? (
          <Empty className="min-h-56 p-6">
            <EmptyHeader className="max-w-sm">
              <EmptyMedia variant="icon">
                <ScrollTextIcon className="size-5" aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle className="text-base">{COURSE_ENROLLMENT_GRADE_MESSAGES.NO_PUBLISHED_GRADES_TITLE}</EmptyTitle>
              <EmptyDescription>
                {isClosed ? COURSE_ENROLLMENT_GRADE_MESSAGES.NO_PUBLISHED_GRADES_CLOSED : COURSE_ENROLLMENT_GRADE_MESSAGES.NO_PUBLISHED_GRADES}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
        {!isLoading && !hasError && grades.length > 0 ? (
          <ul className="space-y-2">
            {grades.map((grade) => (
              <li key={grade.id} className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
                <span className="min-w-0 font-medium wrap-break-word">{grade.evaluation}</span>
                <span className="bg-muted inline-flex min-w-13 shrink-0 items-center justify-center rounded-md px-3 py-1.5 text-center font-semibold tabular-nums">
                  {formatGradeValue(grade.value)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function StudentGradeDialog({ enrollment, open, onOpenChange }: StudentGradeDialogProps): ReactElement {
  if (!open) {
    return <></>;
  }

  return <StudentGradeDialogContent key={enrollment.id} enrollment={enrollment} onOpenChange={onOpenChange} />;
}
