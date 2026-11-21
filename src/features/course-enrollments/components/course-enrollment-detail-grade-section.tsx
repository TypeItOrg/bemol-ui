"use client";

import { useState } from "react";
import type { ReactElement } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { ClipboardCheckIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@common/components/ui/button";
import { safelyRunAction } from "@common/utils/safe-action.util";

import {
  cancelInstitutionalGradeDeletionAction,
  cancelTeacherGradeDeletionAction,
  deleteInstitutionalGradeAction,
  deleteTeacherGradeAction,
} from "@features/course-enrollments/actions/course-enrollment-grade.actions";
import { SectionHeader } from "@features/course-enrollments/components/course-enrollment-detail-items";
import { CourseEnrollmentGradeDeleteDialog } from "@features/course-enrollments/components/course-enrollment-grade-delete-dialog";
import { CourseEnrollmentGradeFormDialog } from "@features/course-enrollments/components/course-enrollment-grade-form-dialog";
import { CourseEnrollmentGradeHistoryDialog } from "@features/course-enrollments/components/course-enrollment-grade-history-dialog";
import { CourseEnrollmentGradesBody } from "@features/course-enrollments/components/course-enrollment-grades-body";
import { COURSE_ENROLLMENT_GRADE_MESSAGES } from "@features/course-enrollments/constants/course-enrollment-grade.constants";
import type { GradeManagementMode } from "@features/course-enrollments/services/course-enrollment-grade-client.service";
import type { CourseEnrollmentGrade } from "@features/course-enrollments/types/course-enrollment-grade.types";
import type { CourseEnrollment } from "@features/course-enrollments/types/course-enrollment.types";
import { invalidateGradeQueries } from "@features/course-enrollments/utils/course-enrollment-grade-query-keys.util";

type DetailGradeSectionProps = {
  enrollment: CourseEnrollment;
  mode?: GradeManagementMode;
  classId?: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export function CourseEnrollmentDetailGradeSection({
  enrollment,
  mode = "institutional",
  classId,
  canRead,
  canCreate,
  canUpdate,
  canDelete,
}: DetailGradeSectionProps): ReactElement {
  const queryClient = useQueryClient();

  const [formGrade, setFormGrade] = useState<CourseEnrollmentGrade | undefined>(undefined);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [deleteGrade, setDeleteGrade] = useState<CourseEnrollmentGrade | null>(null);

  const [historyGrade, setHistoryGrade] = useState<{ id: string; label: string } | null>(null);

  const effectiveClassId = classId ?? enrollment.courseClassId;

  async function handleCancelDeletion(grade: CourseEnrollmentGrade): Promise<void> {
    const result = await safelyRunAction(
      mode === "teacher"
        ? cancelTeacherGradeDeletionAction(effectiveClassId, enrollment.id, grade.id, grade.version)
        : cancelInstitutionalGradeDeletionAction(enrollment.id, grade.id, grade.version),
      "No se pudo deshacer la eliminación.",
    );

    if (result.error) {
      toast.error(result.error);

      return;
    }

    toast.success("Eliminación deshecha.");
    void invalidateGradeQueries(queryClient);
  }

  function handleSaved(): void {
    void invalidateGradeQueries(queryClient);
  }

  function handleDeleteConfirm(grade: CourseEnrollmentGrade): Promise<{ error?: string }> {
    if (mode === "teacher") {
      return deleteTeacherGradeAction(effectiveClassId, enrollment.id, grade.id, grade.version);
    }

    return deleteInstitutionalGradeAction(enrollment.id, grade.id, grade.version);
  }

  if (!canRead) {
    return <></>;
  }

  const canEdit = enrollment.status === "ENROLLED";

  const showAddButton = canCreate && canEdit;

  return (
    <section aria-labelledby="enrollment-grades-title" className="bg-muted/25 rounded-xl border p-5 md:p-6">
      <SectionHeader
        id="enrollment-grades-title"
        icon={ClipboardCheckIcon}
        title="Notas"
        description="Calificaciones registradas y estado de publicación para esta cursada."
        action={
          showAddButton ? (
            <Button
              size="lg"
              className="w-full @xl/section-header:w-auto"
              onClick={() => {
                setFormGrade(undefined);
                setIsFormOpen(true);
              }}
            >
              {COURSE_ENROLLMENT_GRADE_MESSAGES.ADD_GRADE}
            </Button>
          ) : undefined
        }
      />
      <div className="pt-5">
        <CourseEnrollmentGradesBody
          key={`${enrollment.id}-${mode}`}
          mode={mode}
          enrollmentId={enrollment.id}
          classId={mode === "teacher" ? effectiveClassId : undefined}
          variant="inline"
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
        />
      </div>
      <CourseEnrollmentGradeFormDialog
        mode={mode}
        enrollmentId={enrollment.id}
        classId={mode === "teacher" ? effectiveClassId : undefined}
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
        classId={mode === "teacher" ? effectiveClassId : undefined}
        gradeId={historyGrade?.id ?? null}
        gradeLabel={historyGrade?.label}
        open={historyGrade !== null}
        onOpenChange={(next) => {
          if (!next) {
            setHistoryGrade(null);
          }
        }}
      />
    </section>
  );
}
