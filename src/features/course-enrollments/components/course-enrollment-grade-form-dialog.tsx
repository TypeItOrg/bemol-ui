"use client";

import { useActionState } from "react";
import type { ReactElement } from "react";

import { CircleAlertIcon, ClipboardCheckIcon, PencilIcon } from "lucide-react";

import { ActionForm } from "@common/components/action-form";
import { Alert, AlertDescription } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@common/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@common/components/ui/field";
import { Input } from "@common/components/ui/input";
import { safelyRunAction } from "@common/utils/safe-action.util";

import {
  createInstitutionalGradeAction,
  createTeacherGradeAction,
  updateInstitutionalGradeAction,
  updateTeacherGradeAction,
  type GradeActionResult,
} from "@features/course-enrollments/actions/course-enrollment-grade.actions";
import { COURSE_ENROLLMENT_GRADE_MESSAGES } from "@features/course-enrollments/constants/course-enrollment-grade.constants";
import { GRADE_MANAGEMENT_MODE, type GradeManagementMode } from "@features/course-enrollments/services/course-enrollment-grade-client.service";
import { COURSE_ENROLLMENT_GRADE_STATUS } from "@features/course-enrollments/types/course-enrollment-grade-status.types";
import type { CourseEnrollmentGrade } from "@features/course-enrollments/types/course-enrollment-grade.types";
import { formatGradeValue } from "@features/course-enrollments/utils/course-enrollment-grade-format.util";

type GradeFormDialogProps = {
  mode: GradeManagementMode;
  enrollmentId: string;
  classId?: string;
  grade?: CourseEnrollmentGrade;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

function GradeFormContent({ mode, enrollmentId, classId, grade, onOpenChange, onSaved }: Omit<GradeFormDialogProps, "open">): ReactElement {
  const [state, formAction, isPending] = useActionState(async (_previous: GradeActionResult, formData: FormData) => {
    async function run(): Promise<GradeActionResult> {
      if (grade) {
        if (mode === GRADE_MANAGEMENT_MODE.TEACHER) {
          if (!classId) {
            return { error: "Falta la clase." };
          }

          return updateTeacherGradeAction(classId, enrollmentId, grade.id, grade.version, formData);
        }

        return updateInstitutionalGradeAction(enrollmentId, grade.id, grade.version, formData);
      }

      if (mode === GRADE_MANAGEMENT_MODE.TEACHER) {
        if (!classId) {
          return { error: "Falta la clase." };
        }

        return createTeacherGradeAction(classId, enrollmentId, formData);
      }

      return createInstitutionalGradeAction(enrollmentId, formData);
    }

    const result = await safelyRunAction(run(), COURSE_ENROLLMENT_GRADE_MESSAGES.MUTATION_FAILED);

    if (!result.error && !result.fieldErrors) {
      onOpenChange(false);
      onSaved();
    }

    return result;
  }, {});

  const isEditingPublished = grade !== undefined && grade.publicationStatus !== COURSE_ENROLLMENT_GRADE_STATUS.DRAFT;

  function handleOpenChange(nextOpen: boolean): void {
    if (isPending && !nextOpen) {
      return;
    }

    onOpenChange(nextOpen);
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-5 overflow-hidden sm:max-w-md"
        onInteractOutside={(event) => {
          if (isPending) {
            event.preventDefault();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (isPending) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader className="shrink-0 items-center pt-2 text-center">
          <div className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl">
            {grade ? <PencilIcon className="size-6" aria-hidden="true" /> : <ClipboardCheckIcon className="size-6" aria-hidden="true" />}
          </div>
          <DialogTitle className="leading-snug font-semibold">
            {grade ? COURSE_ENROLLMENT_GRADE_MESSAGES.EDIT_GRADE : COURSE_ENROLLMENT_GRADE_MESSAGES.ADD_GRADE}
          </DialogTitle>
          <DialogDescription className="max-w-sm text-pretty">
            {isEditingPublished ? COURSE_ENROLLMENT_GRADE_MESSAGES.PUBLISHED_EDIT_DESCRIPTION : COURSE_ENROLLMENT_GRADE_MESSAGES.DRAFT_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>
        <ActionForm action={formAction} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="-mx-4 min-h-0 space-y-4 overflow-y-auto px-4 pb-5">
            {state.error ? (
              <Alert variant="destructive">
                <CircleAlertIcon />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            <Field data-invalid={Boolean(state.fieldErrors?.evaluation) || undefined}>
              <FieldLabel htmlFor="evaluation" required>
                Evaluación
              </FieldLabel>
              <Input
                id="evaluation"
                name="evaluation"
                required
                maxLength={150}
                disabled={isPending}
                aria-invalid={Boolean(state.fieldErrors?.evaluation) || undefined}
                defaultValue={grade?.evaluation ?? ""}
                placeholder="Parcial 1"
              />
              <FieldError>{state.fieldErrors?.evaluation}</FieldError>
            </Field>
            <Field data-invalid={Boolean(state.fieldErrors?.value) || undefined}>
              <FieldLabel htmlFor="value" required>
                Nota
              </FieldLabel>
              <Input
                id="value"
                name="value"
                type="text"
                inputMode="decimal"
                required
                disabled={isPending}
                aria-invalid={Boolean(state.fieldErrors?.value) || undefined}
                defaultValue={grade ? formatGradeValue(grade.value) : ""}
                placeholder="7,50"
              />
              <FieldError>{state.fieldErrors?.value}</FieldError>
            </Field>
          </div>
          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" size="lg" disabled={isPending} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending ? "Guardando…" : COURSE_ENROLLMENT_GRADE_MESSAGES.SAVE_GRADE}
            </Button>
          </DialogFooter>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

export function CourseEnrollmentGradeFormDialog({
  mode,
  enrollmentId,
  classId,
  grade,
  open,
  onOpenChange,
  onSaved,
}: GradeFormDialogProps): ReactElement {
  if (!open) {
    return <></>;
  }

  return (
    <GradeFormContent
      key={grade ? `edit-${grade.id}-${grade.version}` : "create"}
      mode={mode}
      enrollmentId={enrollmentId}
      classId={classId}
      grade={grade}
      onOpenChange={onOpenChange}
      onSaved={onSaved}
    />
  );
}
