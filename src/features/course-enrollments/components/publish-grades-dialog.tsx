"use client";

import { useActionState } from "react";
import type { ReactElement } from "react";

import { CircleAlertIcon, SendIcon } from "lucide-react";

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

import { publishInstitutionalGradesAction, publishTeacherGradesAction } from "@features/course-enrollments/actions/course-enrollment-grade.actions";
import { COURSE_ENROLLMENT_GRADE_MESSAGES } from "@features/course-enrollments/constants/course-enrollment-grade.constants";
import { GRADE_MANAGEMENT_MODE, type GradeManagementMode } from "@features/course-enrollments/services/course-enrollment-grade-client.service";
import type { PendingGradesSummary } from "@features/course-enrollments/types/pending-grades-summary.types";

type PublishGradesDialogProps = {
  classId: string;
  mode: GradeManagementMode;
  summary: PendingGradesSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished: () => void;
  label?: string;
};

type PublishState = { error?: string };

function PublishConfirmForm({
  classId,
  mode,
  summary,
  onOpenChange,
  onPublished,
  label,
}: {
  classId: string;
  mode: GradeManagementMode;
  summary: PendingGradesSummary | null;
  onOpenChange: (open: boolean) => void;
  onPublished: () => void;
  label?: string;
}): ReactElement {
  const [state, formAction, isPending] = useActionState(async (): Promise<PublishState> => {
    const result = await safelyRunAction(
      mode === GRADE_MANAGEMENT_MODE.TEACHER ? publishTeacherGradesAction(classId) : publishInstitutionalGradesAction(classId),
      "No se pudieron publicar las notas.",
    );

    if (result.error) {
      return { error: result.error };
    }

    onOpenChange(false);
    onPublished();

    return {};
  }, {});

  function handleOpenChange(next: boolean): void {
    if (isPending && !next) {
      return;
    }

    onOpenChange(next);
  }

  const pendingText =
    summary && summary.pendingChanges > 0
      ? `${summary.pendingChanges} ${summary.pendingChanges === 1 ? "cambio pendiente" : "cambios pendientes"} para ${summary.affectedStudents} ${summary.affectedStudents === 1 ? "estudiante" : "estudiantes"}.`
      : "Sin cambios pendientes.";

  return (
    <AlertDialog open onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <ActionForm action={formAction}>
          <AlertDialogHeader>
            <div className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl">
              <SendIcon className="size-6" aria-hidden="true" />
            </div>
            <AlertDialogTitle>{COURSE_ENROLLMENT_GRADE_MESSAGES.PUBLISH_CONFIRM_TITLE}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta publicación afecta a toda la clase: se publicarán todos los cambios pendientes de notas de esta clase.
              <span className="text-foreground mt-2 block font-semibold">{pendingText}</span>
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
            <Button type="submit" size="lg" disabled={isPending || !summary || summary.pendingChanges === 0}>
              {isPending ? "Publicando…" : (label ?? COURSE_ENROLLMENT_GRADE_MESSAGES.PUBLISH_GRADES)}
            </Button>
          </AlertDialogFooter>
        </ActionForm>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function PublishGradesDialog({ classId, mode, summary, open, onOpenChange, onPublished, label }: PublishGradesDialogProps): ReactElement {
  if (!open) {
    return <></>;
  }

  return (
    <PublishConfirmForm
      key={`${classId}-${mode}`}
      classId={classId}
      mode={mode}
      summary={summary}
      onOpenChange={onOpenChange}
      onPublished={onPublished}
      label={label}
    />
  );
}
