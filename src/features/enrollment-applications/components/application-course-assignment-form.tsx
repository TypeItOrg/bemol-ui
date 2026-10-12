"use client";

import type { ReactElement } from "react";

import { CircleAlertIcon, UserPlusIcon } from "lucide-react";

import { ActionForm } from "@common/components/action-form";
import { Alert, AlertDescription } from "@common/components/ui/alert";
import { AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@common/components/ui/alert-dialog";
import { Button } from "@common/components/ui/button";
import { Skeleton } from "@common/components/ui/skeleton";

import { CourseEnrollmentAssignmentFields } from "@features/course-enrollments/components/course-enrollment-assignment-fields";
import type { CourseEnrollmentAssignmentOptions } from "@features/course-enrollments/types/course-enrollment-assignment-options.types";
import type { EnrollmentApplicationCourse } from "@features/enrollment-applications/types/enrollment-application-course.types";

export function ApplicationCourseAssignmentForm({
  formAction,
  course,
  isLoadingOptions,
  state,
  options,
  optionsRevision,
  isPending,
  onRefreshOptions,
  onOpenChange,
}: {
  formAction: (payload: FormData) => void;
  course: EnrollmentApplicationCourse;
  isLoadingOptions: boolean;
  state: { error?: string; invalidDayIds?: string[] };
  options: CourseEnrollmentAssignmentOptions | undefined;
  optionsRevision: number;
  isPending: boolean;
  onRefreshOptions: () => void;
  onOpenChange: (open: boolean) => void;
}): ReactElement {
  return (
    <ActionForm action={formAction} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <AlertDialogHeader className="shrink-0">
        <div className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl">
          <UserPlusIcon className="size-6" aria-hidden="true" />
        </div>
        <AlertDialogTitle>Inscribir solicitud de cursada</AlertDialogTitle>
        <AlertDialogDescription>
          {course.academicSpaceName} · {course.academicYear ? `Ciclo ${course.academicYear} · ` : ""}
          {course.academicLevelName ?? "Sin nivel"}
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="-mx-5 flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto px-5" aria-busy={isLoadingOptions}>
        {state.error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="h-56 shrink-0">
          {options ? (
            <CourseEnrollmentAssignmentFields
              compact
              key={`${course.courseId}-${optionsRevision}`}
              options={options}
              disabled={isPending}
              invalidDayIds={state.invalidDayIds}
            />
          ) : (
            <Skeleton role="status" aria-label="Cargando clases y horarios" className="h-full w-full rounded-xl" />
          )}
        </div>
      </div>
      <AlertDialogFooter className="shrink-0 sm:flex-wrap">
        <Button type="button" variant="outline" size="lg" disabled={isPending || isLoadingOptions} onClick={onRefreshOptions}>
          Actualizar horarios
        </Button>
        <Button type="button" variant="outline" size="lg" disabled={isPending} onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" disabled={isPending || !options}>
          {isPending ? "Inscribiendo…" : "Confirmar inscripción"}
        </Button>
      </AlertDialogFooter>
    </ActionForm>
  );
}
