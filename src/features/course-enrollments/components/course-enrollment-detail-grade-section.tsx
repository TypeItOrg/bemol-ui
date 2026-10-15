"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactElement } from "react";

import { useRouter } from "next/navigation";

import { CircleAlertIcon, ScrollTextIcon } from "lucide-react";
import { toast } from "sonner";

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
import { Card, CardContent, CardHeader, CardTitle } from "@common/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@common/components/ui/empty";
import { Skeleton } from "@common/components/ui/skeleton";
import { safelyRunAction } from "@common/utils/safe-action.util";

import {
  cancelInstitutionalGradeDeletionAction,
  deleteInstitutionalGradeAction,
} from "@features/course-enrollments/actions/course-enrollment-grade.actions";
import { CourseEnrollmentGradeFormDialog } from "@features/course-enrollments/components/course-enrollment-grade-form-dialog";
import { CourseEnrollmentGradeStatusBadge } from "@features/course-enrollments/components/course-enrollment-grade-status-badge";
import { COURSE_ENROLLMENT_GRADE_MESSAGES } from "@features/course-enrollments/constants/course-enrollment-grade.constants";
import { fetchManagementGradesClient } from "@features/course-enrollments/services/course-enrollment-grade-client.service";
import type { CourseEnrollmentGrade } from "@features/course-enrollments/types/course-enrollment-grade.types";
import type { CourseEnrollment } from "@features/course-enrollments/types/course-enrollment.types";
import {
  notifyGradesChanged,
  useGradesChangedListener,
} from "@features/course-enrollments/utils/course-enrollment-grade-events.util";
import { formatGradeValue } from "@features/course-enrollments/utils/course-enrollment-grade-format.util";

type DetailGradeSectionProps = {
  enrollment: CourseEnrollment;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

function formatAudit(prefix: string, person?: { fullName: string } | null, date?: string | null): string | null {
  if (!person || !date) {
    return null;
  }

  const formatted = new Date(date).toLocaleDateString("es-AR");

  return `${prefix} por ${person.fullName} · ${formatted}`;
}

export function CourseEnrollmentDetailGradeSection({
  enrollment,
  canRead,
  canCreate,
  canUpdate,
  canDelete,
}: DetailGradeSectionProps): ReactElement {
  const router = useRouter();
  const [grades, setGrades] = useState<CourseEnrollmentGrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formGrade, setFormGrade] = useState<CourseEnrollmentGrade | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteGrade, setDeleteGrade] = useState<CourseEnrollmentGrade | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      setGrades(await fetchManagementGradesClient(enrollment.id));
    } catch {
      setLoadError(COURSE_ENROLLMENT_GRADE_MESSAGES.LOAD_FAILED);
    } finally {
      setIsLoading(false);
    }
  }, [enrollment.id]);

  const handleGradesChanged = useCallback(() => {
    if (!canRead) {
      return;
    }

    void load();
  }, [canRead, load]);

  useGradesChangedListener(handleGradesChanged);

  useEffect(() => {
    if (!canRead) {
      return;
    }

    void load();
  }, [canRead, load]);

  async function handleDelete(): Promise<void> {
    if (!deleteGrade) {
      return;
    }

    setIsDeleting(true);

    const result = await safelyRunAction(
      deleteInstitutionalGradeAction(enrollment.id, deleteGrade.id, deleteGrade.version),
      "No se pudo eliminar la nota.",
    );

    setIsDeleting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (deleteGrade.publicationStatus === "DRAFT") {
      toast.success("Borrador eliminado.");
    } else {
      toast.success("Nota marcada como pendiente de eliminación.");
    }

    setDeleteGrade(null);
    await load();
    notifyGradesChanged();
    router.refresh();
  }

  async function handleCancelDeletion(grade: CourseEnrollmentGrade): Promise<void> {
    const result = await safelyRunAction(
      cancelInstitutionalGradeDeletionAction(enrollment.id, grade.id),
      "No se pudo deshacer la eliminación.",
    );

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Eliminación deshecha.");
    await load();
    notifyGradesChanged();
    router.refresh();
  }

  function handleSaved(): void {
    void load();
    notifyGradesChanged();
    router.refresh();
  }

  if (!canRead) {
    return <></>;
  }

  const canEdit = enrollment.status === "ENROLLED";
  const showAddButton = canCreate && canEdit;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Notas</CardTitle>
        {showAddButton ? (
          <Button
            size="lg"
            onClick={() => {
              setFormGrade(undefined);
              setIsFormOpen(true);
            }}
          >
            {COURSE_ENROLLMENT_GRADE_MESSAGES.ADD_GRADE}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Cargando notas">
            <span className="sr-only" role="status">
              Cargando notas…
            </span>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-48" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : grades.length === 0 ? (
          <Empty className="min-h-56 p-6">
            <EmptyHeader className="max-w-sm">
              <EmptyMedia variant="icon">
                <ScrollTextIcon className="size-5" aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle className="text-base">Todavía no hay notas cargadas</EmptyTitle>
              <EmptyDescription>{COURSE_ENROLLMENT_GRADE_MESSAGES.NO_GRADES}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="space-y-3">
            {grades.map((grade) => {
              const created = formatAudit("Cargada", grade.createdBy, grade.createdAt);
              const updated = formatAudit("Última modificación", grade.updatedBy, grade.updatedAt);
              const published = formatAudit("Publicada", grade.publishedBy, grade.publishedAt ?? null);

              return (
                <li key={grade.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium wrap-break-word">{grade.evaluation}</p>
                      <p className="text-lg font-semibold tabular-nums">{formatGradeValue(grade.value)}</p>
                      {grade.publishedEvaluation != null &&
                      grade.publicationStatus === "PENDING_CHANGES" &&
                      grade.publishedValue != null ? (
                        <p className="text-muted-foreground text-sm">
                          Publicado actualmente: {formatGradeValue(grade.publishedValue)} → cambio pendiente:{" "}
                          {formatGradeValue(grade.value)}
                        </p>
                      ) : null}
                    </div>
                    <CourseEnrollmentGradeStatusBadge status={grade.publicationStatus} />
                  </div>
                  <div className="text-muted-foreground mt-1 space-y-0.5 text-xs">
                    {created ? <p>{created}</p> : null}
                    {updated ? <p>{updated}</p> : null}
                    {published ? <p>{published}</p> : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {canUpdate && canEdit && grade.publicationStatus !== "PENDING_DELETION" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormGrade(grade);
                          setIsFormOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                    ) : null}
                    {canDelete && canEdit && grade.publicationStatus !== "PENDING_DELETION" ? (
                      <Button variant="outline" size="sm" onClick={() => setDeleteGrade(grade)}>
                        Eliminar
                      </Button>
                    ) : null}
                    {canDelete && canEdit && grade.publicationStatus === "PENDING_DELETION" ? (
                      <Button variant="outline" size="sm" onClick={() => void handleCancelDeletion(grade)}>
                        {COURSE_ENROLLMENT_GRADE_MESSAGES.CANCEL_DELETION}
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      <CourseEnrollmentGradeFormDialog
        mode="institutional"
        enrollmentId={enrollment.id}
        grade={formGrade}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSaved={handleSaved}
      />
      <AlertDialog open={deleteGrade !== null} onOpenChange={(next) => !next && !isDeleting && setDeleteGrade(null)}>
        <AlertDialogContent>
          <ActionForm action={async () => handleDelete()} className="space-y-4">
            <AlertDialogHeader>
              <AlertDialogTitle>{COURSE_ENROLLMENT_GRADE_MESSAGES.DELETE_GRADE}</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteGrade?.publicationStatus === "DRAFT"
                  ? COURSE_ENROLLMENT_GRADE_MESSAGES.DELETE_DRAFT_CONFIRM
                  : COURSE_ENROLLMENT_GRADE_MESSAGES.DELETE_PUBLISHED_CONFIRM}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button type="button" variant="outline" disabled={isDeleting} onClick={() => setDeleteGrade(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={isDeleting}>
                {isDeleting ? "Eliminando…" : "Confirmar"}
              </Button>
            </AlertDialogFooter>
          </ActionForm>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
