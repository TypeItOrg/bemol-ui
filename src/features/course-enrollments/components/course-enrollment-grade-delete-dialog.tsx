"use client";

import { useActionState } from "react";
import type { ReactElement } from "react";

import { CircleAlertIcon, Trash2Icon } from "lucide-react";

import { ActionForm } from "@common/components/action-form";
import { Alert, AlertDescription } from "@common/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@common/components/ui/alert-dialog";
import { Button } from "@common/components/ui/button";
import { safelyRunAction } from "@common/utils/safe-action.util";

import { COURSE_ENROLLMENT_GRADE_MESSAGES } from "@features/course-enrollments/constants/course-enrollment-grade.constants";
import { COURSE_ENROLLMENT_GRADE_STATUS } from "@features/course-enrollments/types/course-enrollment-grade-status.types";
import type { CourseEnrollmentGrade } from "@features/course-enrollments/types/course-enrollment-grade.types";

type GradeDeleteDialogProps = {
  grade: CourseEnrollmentGrade | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (grade: CourseEnrollmentGrade) => Promise<{ error?: string }>;
  onDeleted: (grade: CourseEnrollmentGrade) => void;
};

type DeleteConfirmFormProps = {
  grade: CourseEnrollmentGrade;
  onOpenChange: (open: boolean) => void;
  onConfirm: (grade: CourseEnrollmentGrade) => Promise<{ error?: string }>;
  onDeleted: (grade: CourseEnrollmentGrade) => void;
};

function DeleteConfirmForm({ grade, onOpenChange, onConfirm, onDeleted }: DeleteConfirmFormProps): ReactElement {
  const [state, formAction, isPending] = useActionState(async (): Promise<{ error?: string }> => {
    const result = await safelyRunAction(onConfirm(grade), "No se pudo eliminar la nota.");

    if (result.error) {
      return { error: result.error };
    }

    onDeleted(grade);

    return {};
  }, {});

  const isDraft = grade.publicationStatus === COURSE_ENROLLMENT_GRADE_STATUS.DRAFT;

  function handleOpenChange(next: boolean): void {
    if (isPending && !next) {
      return;
    }

    onOpenChange(next);
  }

  return (
    <AlertDialog open onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <ActionForm action={formAction}>
          <AlertDialogHeader>
            <div className="bg-destructive/10 text-destructive mb-1 flex size-12 items-center justify-center rounded-2xl">
              <Trash2Icon className="size-6" aria-hidden="true" />
            </div>
            <AlertDialogTitle>{COURSE_ENROLLMENT_GRADE_MESSAGES.DELETE_GRADE}</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              {isDraft ? (
                <>
                  ¿Querés eliminar el borrador de <span className="text-foreground font-semibold">{grade.evaluation}</span>? Esta acción no se puede
                  deshacer y no afecta a los estudiantes.
                </>
              ) : (
                <>
                  Vas a marcar <span className="text-foreground font-semibold">{grade.evaluation}</span> para eliminar; seguirá visible para el
                  estudiante hasta que se publiquen las notas de la clase.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {state.error ? (
            <Alert className="mt-4" variant="destructive">
              <CircleAlertIcon />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter className="mt-5">
            <AlertDialogCancel type="button" size="lg" disabled={isPending}>
              Cancelar
            </AlertDialogCancel>
            <Button type="submit" size="lg" variant="destructive" disabled={isPending}>
              {isPending ? "Eliminando…" : "Confirmar"}
            </Button>
          </AlertDialogFooter>
        </ActionForm>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function CourseEnrollmentGradeDeleteDialog({ grade, onOpenChange, onConfirm, onDeleted }: GradeDeleteDialogProps): ReactElement {
  if (!grade) {
    return <></>;
  }

  return <DeleteConfirmForm key={grade.id} grade={grade} onOpenChange={onOpenChange} onConfirm={onConfirm} onDeleted={onDeleted} />;
}
