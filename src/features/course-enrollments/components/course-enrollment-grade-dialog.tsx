"use client";

import { useState } from "react";
import type { ReactElement } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { ClipboardCheckIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@common/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@common/components/ui/dialog";
import { safelyRunAction } from "@common/utils/safe-action.util";

import {
  cancelInstitutionalGradeDeletionAction,
  cancelTeacherGradeDeletionAction,
  deleteInstitutionalGradeAction,
  deleteTeacherGradeAction,
} from "@features/course-enrollments/actions/course-enrollment-grade.actions";
import { CourseEnrollmentGradeDeleteDialog } from "@features/course-enrollments/components/course-enrollment-grade-delete-dialog";
import { CourseEnrollmentGradeFormDialog } from "@features/course-enrollments/components/course-enrollment-grade-form-dialog";
import { CourseEnrollmentGradeHistoryDialog } from "@features/course-enrollments/components/course-enrollment-grade-history-dialog";
import { CourseEnrollmentGradesBody } from "@features/course-enrollments/components/course-enrollment-grades-body";
import { COURSE_ENROLLMENT_GRADE_MESSAGES } from "@features/course-enrollments/constants/course-enrollment-grade.constants";
import { GRADE_MANAGEMENT_MODE, type GradeManagementMode } from "@features/course-enrollments/services/course-enrollment-grade-client.service";
import type { CourseEnrollmentGrade } from "@features/course-enrollments/types/course-enrollment-grade.types";
import { COURSE_ENROLLMENT_STATUS } from "@features/course-enrollments/types/course-enrollment-status.types";
import type { CourseEnrollment } from "@features/course-enrollments/types/course-enrollment.types";
import { invalidateGradeQueries } from "@features/course-enrollments/utils/course-enrollment-grade-query-keys.util";

type GradeDialogProps = {
  enrollment: CourseEnrollment;
  mode: GradeManagementMode;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
};

function GradeDialogContent({
  enrollment,
  mode,
  canCreate,
  canUpdate,
  canDelete,
  onOpenChange,
  onChanged,
}: Omit<GradeDialogProps, "open">): ReactElement {
  const queryClient = useQueryClient();

  const [formGrade, setFormGrade] = useState<CourseEnrollmentGrade | undefined>(undefined);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [deleteGrade, setDeleteGrade] = useState<CourseEnrollmentGrade | null>(null);

  const [historyGrade, setHistoryGrade] = useState<{ id: string; label: string } | null>(null);

  const [listError, setListError] = useState(false);

  const [listLoading, setListLoading] = useState(true);

  const classId = enrollment.courseClassId;

  function handleRetry(): void {
    void invalidateGradeQueries(queryClient);
  }

  async function handleCancelDeletion(grade: CourseEnrollmentGrade): Promise<void> {
    const result = await safelyRunAction(
      mode === GRADE_MANAGEMENT_MODE.TEACHER
        ? cancelTeacherGradeDeletionAction(classId, enrollment.id, grade.id, grade.version)
        : cancelInstitutionalGradeDeletionAction(enrollment.id, grade.id, grade.version),
      "No se pudo deshacer la eliminación.",
    );

    if (result.error) {
      toast.error(result.error);

      return;
    }

    void invalidateGradeQueries(queryClient);
    onChanged?.();
  }

  function handleSaved(): void {
    void invalidateGradeQueries(queryClient);
    onChanged?.();
  }

  function handleDeleteConfirm(grade: CourseEnrollmentGrade): Promise<{ error?: string }> {
    if (mode === GRADE_MANAGEMENT_MODE.TEACHER) {
      return deleteTeacherGradeAction(classId, enrollment.id, grade.id, grade.version);
    }

    return deleteInstitutionalGradeAction(enrollment.id, grade.id, grade.version);
  }

  const canEdit = enrollment.status === COURSE_ENROLLMENT_STATUS.ENROLLED;

  const hasSubDialog = isFormOpen || deleteGrade !== null || historyGrade !== null;

  return (
    <>
      <Dialog open={!hasSubDialog} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex max-h-[calc(100dvh-2rem)] flex-col gap-5 overflow-hidden sm:max-w-2xl"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogHeader className="shrink-0 items-center pt-2 text-center">
            <div className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl">
              <ClipboardCheckIcon className="size-6" aria-hidden="true" />
            </div>
            <DialogTitle className="leading-snug font-semibold">{COURSE_ENROLLMENT_GRADE_MESSAGES.DIALOG_TITLE}</DialogTitle>
            <DialogDescription className="max-w-md leading-relaxed text-balance">
              Calificaciones registradas para <span className="text-foreground font-semibold">{enrollment.studentName}</span> en{" "}
              <span className="text-foreground font-semibold">{enrollment.academicSpaceName}</span> ({enrollment.courseClassLabel}).
            </DialogDescription>
          </DialogHeader>
          <div className="-mx-4 min-h-0 flex-1 overflow-y-auto px-4">
            <CourseEnrollmentGradesBody
              key={`${enrollment.id}-${mode}`}
              mode={mode}
              enrollmentId={enrollment.id}
              classId={classId}
              variant="dialog"
              canUpdate={canUpdate}
              canDelete={canDelete}
              canEdit={canEdit}
              onEdit={(grade) => {
                setFormGrade(grade);
                setIsFormOpen(true);
              }}
              onDelete={setDeleteGrade}
              onHistory={(gradeId, label) => setHistoryGrade({ id: gradeId, label })}
              onCancelDeletion={(grade) => void handleCancelDeletion(grade)}
              onErrorChange={setListError}
              onLoadingChange={setListLoading}
            />
          </div>
          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            {listError ? (
              <Button type="button" size="lg" onClick={handleRetry}>
                Reintentar
              </Button>
            ) : null}
            {!listError && canCreate && canEdit ? (
              <Button
                type="button"
                size="lg"
                disabled={listLoading}
                onClick={() => {
                  setFormGrade(undefined);
                  setIsFormOpen(true);
                }}
              >
                {COURSE_ENROLLMENT_GRADE_MESSAGES.ADD_GRADE}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CourseEnrollmentGradeFormDialog
        mode={mode}
        enrollmentId={enrollment.id}
        classId={classId}
        grade={formGrade}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSaved={handleSaved}
      />
      <CourseEnrollmentGradeDeleteDialog
        grade={deleteGrade}
        onOpenChange={(next) => {
          if (!next) {
            setDeleteGrade(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        onDeleted={() => {
          setDeleteGrade(null);
          handleSaved();
        }}
      />
      <CourseEnrollmentGradeHistoryDialog
        key={historyGrade ? `history-${historyGrade.id}` : "history-closed"}
        mode={mode}
        enrollmentId={enrollment.id}
        classId={mode === GRADE_MANAGEMENT_MODE.TEACHER ? classId : undefined}
        gradeId={historyGrade?.id ?? null}
        gradeLabel={historyGrade?.label}
        open={historyGrade !== null}
        onOpenChange={(next) => {
          if (!next) {
            setHistoryGrade(null);
          }
        }}
      />
    </>
  );
}

export function CourseEnrollmentGradeDialog(props: GradeDialogProps): ReactElement {
  if (!props.open) {
    return <></>;
  }

  return <GradeDialogContent key={`${props.enrollment.id}-${props.mode}`} {...props} />;
}
