"use client";

import { useActionState, type ReactElement } from "react";

import { CircleAlertIcon, CircleXIcon } from "lucide-react";

import { ActionForm } from "@common/components/action-form";
import { Alert, AlertDescription } from "@common/components/ui/alert";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@common/components/ui/alert-dialog";
import { Button } from "@common/components/ui/button";
import { Field, FieldLabel } from "@common/components/ui/field";
import { Textarea } from "@common/components/ui/textarea";
import { safelyRunAction } from "@common/utils/safe-action.util";

import { AcademicScope } from "@features/academic/utils/academic-scope.util";
import { formatStudyPlanNameWithPrefix } from "@features/academic/utils/study-plan-label.util";
import { rejectApplicationCourseAction } from "@features/course-enrollments/actions/course-enrollment.actions";
import { rejectPlatformApplicationCourseAction } from "@features/course-enrollments/actions/platform-course-enrollment.actions";
import { COURSE_ENROLLMENT_MESSAGES } from "@features/course-enrollments/constants/course-enrollment.constants";
import { type EnrollmentApplicationCourseDialogProps } from "@features/enrollment-applications/types/enrollment-application-course-dialog-props.types";

export function RejectEnrollmentApplicationCourseDialog({
  applicationId,
  institutionId,
  scope = AcademicScope.INSTITUTIONAL,
  course,
  open,
  onOpenChange,
  onResolved,
}: EnrollmentApplicationCourseDialogProps): ReactElement {
  const [state, formAction, isPending] = useActionState(async (_previous: { error?: string }, formData: FormData) => {
    const reason = formData.get("reason");

    const normalizedReason = typeof reason === "string" ? reason : "";

    const result = await safelyRunAction(
      scope === AcademicScope.ADMIN && institutionId
        ? rejectPlatformApplicationCourseAction(institutionId, applicationId, course.applicationCourseId, course.version, normalizedReason)
        : rejectApplicationCourseAction(applicationId, course.applicationCourseId, course.version, normalizedReason),
      COURSE_ENROLLMENT_MESSAGES.MUTATION_UNAVAILABLE,
    );

    if (!result.error) {
      onOpenChange(false);
      onResolved();
    }

    return result;
  }, {});

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => (!isPending ? onOpenChange(nextOpen) : undefined)}>
      <AlertDialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <ActionForm action={formAction} className="space-y-4">
          <AlertDialogHeader>
            <div className="bg-destructive/10 text-destructive mb-1 flex size-12 items-center justify-center rounded-2xl">
              <CircleXIcon className="size-6" aria-hidden="true" />
            </div>
            <AlertDialogTitle>Rechazar solicitud de cursada</AlertDialogTitle>
            <AlertDialogDescription>
              {course.academicSpaceName} · {course.academicYear ? `Ciclo ${course.academicYear} · ` : ""}
              {formatStudyPlanNameWithPrefix(course)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {state.error ? (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <Field className="py-1">
            <FieldLabel htmlFor="reason" required>
              Motivo de rechazo
            </FieldLabel>
            <Textarea id="reason" name="reason" rows={4} maxLength={1000} required disabled={isPending} />
          </Field>
          <AlertDialogFooter>
            <Button type="button" variant="outline" size="lg" disabled={isPending} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="lg" variant="destructive" disabled={isPending}>
              {isPending ? "Rechazando…" : "Rechazar solicitud"}
            </Button>
          </AlertDialogFooter>
        </ActionForm>
      </AlertDialogContent>
    </AlertDialog>
  );
}
