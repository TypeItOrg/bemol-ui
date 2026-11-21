"use client";

import { useActionState } from "react";
import type { ReactElement } from "react";

import { CircleAlertIcon } from "lucide-react";
import { toast } from "sonner";

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
import type { CourseEnrollmentGrade } from "@features/course-enrollments/types/course-enrollment-grade.types";
import { formatGradeValue } from "@features/course-enrollments/utils/course-enrollment-grade-format.util";

type GradeFormDialogProps = {
  mode: "institutional" | "teacher";
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
        if (mode === "teacher") {
          if (!classId) {
            return { error: "Falta la clase." };
          }

          return updateTeacherGradeAction(classId, enrollmentId, grade.id, grade.version, formData);
        }

        return updateInstitutionalGradeAction(enrollmentId, grade.id, grade.version, formData);
      }

      if (mode === "teacher") {
        if (!classId) {
          return { error: "Falta la clase." };
        }

        return createTeacherGradeAction(classId, enrollmentId, formData);
      }

      return createInstitutionalGradeAction(enrollmentId, formData);
    }

    const result = await safelyRunAction(run(), COURSE_ENROLLMENT_GRADE_MESSAGES.MUTATION_FAILED);

    if (!result.error && !result.fieldErrors) {
      if (result.draft) {
        toast.success(COURSE_ENROLLMENT_GRADE_MESSAGES.DRAFT_SAVED);
      } else if (result.pending) {
        toast.success(COURSE_ENROLLMENT_GRADE_MESSAGES.CHANGES_SAVED);
      } else if (result.unchanged) {
        toast(COURSE_ENROLLMENT_GRADE_MESSAGES.UNCHANGED);
      } else if (result.unconfirmed) {
        toast(COURSE_ENROLLMENT_GRADE_MESSAGES.UNCONFIRMED);
      }

      onOpenChange(false);
      onSaved();
    }

    return result;
  }, {});

  const isEditingPublished = grade !== undefined && grade.publicationStatus !== "DRAFT";

  function handleOpenChange(nextOpen: boolean): void {
    if (isPending && !nextOpen) {
      return;
    }

    onOpenChange(nextOpen);
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[calc(100%_-_2.5rem)] sm:max-w-md">
        <ActionForm action={formAction} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>{grade ? COURSE_ENROLLMENT_GRADE_MESSAGES.EDIT_GRADE : COURSE_ENROLLMENT_GRADE_MESSAGES.ADD_GRADE}</DialogTitle>
            <DialogDescription>
              {isEditingPublished ? COURSE_ENROLLMENT_GRADE_MESSAGES.PUBLISHED_EDIT_DESCRIPTION : COURSE_ENROLLMENT_GRADE_MESSAGES.DRAFT_DESCRIPTION}
            </DialogDescription>
          </DialogHeader>
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
          <DialogFooter>
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
