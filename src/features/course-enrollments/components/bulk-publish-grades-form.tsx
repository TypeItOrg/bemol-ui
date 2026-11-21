"use client";

import { useMemo, useState } from "react";
import type { FormEvent, ReactElement } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@common/components/ui/button";
import { DialogFooter } from "@common/components/ui/dialog";
import { Field, FieldLabel } from "@common/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@common/components/ui/select";
import { safelyRunAction } from "@common/utils/safe-action.util";

import { publishBulkInstitutionalGradesAction } from "@features/course-enrollments/actions/publish-bulk-grades.actions";
import { BulkPublishOutcome } from "@features/course-enrollments/components/bulk-publish-grades-outcome";
import { COURSE_ENROLLMENT_GRADE_BULK_PUBLISH_LIMIT } from "@features/course-enrollments/constants/course-enrollment-grade.constants";
import type { BulkPublishClassResult, BulkPublishResult } from "@features/course-enrollments/types/bulk-publish-grades.types";
import type { PendingClassGrades } from "@features/course-enrollments/types/pending-class-grades.types";
import { invalidateGradeQueries } from "@features/course-enrollments/utils/course-enrollment-grade-query-keys.util";

const ALL_COURSES = "all-courses";

const ALL_CLASSES = "all-classes";

const UNCERTAIN_BATCH_MESSAGE = "No se pudo confirmar la publicación. Verificá el estado antes de reintentar.";

type BulkState = BulkPublishResult & {
  classLabels?: Record<string, string>;
  totalClasses?: number;
};

type BulkPublishGradesFormProps = {
  classes: PendingClassGrades[];
  isRefreshing: boolean;
  refreshError: string | null;
  onRefreshPendingClasses: () => void;
  onOpenChange: (open: boolean) => void;
  onPublished: () => void;
  onPendingChange: (pending: boolean) => void;
  onReportAvailable: () => void;
};

function chunkClassIds(classIds: string[], size: number): string[][] {
  return Array.from({ length: Math.ceil(classIds.length / size) }, (_, index) => classIds.slice(index * size, (index + 1) * size));
}

function formatPendingSummary(count: number): string {
  if (count <= 0) {
    return "Sin cambios en la selección.";
  }

  return count === 1 ? "1 cambio pendiente en la selección." : `${count} cambios pendientes en la selección.`;
}

export function BulkPublishGradesForm({
  classes,
  isRefreshing,
  refreshError,
  onRefreshPendingClasses,
  onOpenChange,
  onPublished,
  onPendingChange,
  onReportAvailable,
}: BulkPublishGradesFormProps): ReactElement {
  const queryClient = useQueryClient();

  const [courseId, setCourseId] = useState<string>(ALL_COURSES);

  const [classId, setClassId] = useState<string>(ALL_CLASSES);

  const [state, setState] = useState<BulkState>({});

  const [isPublishing, setIsPublishing] = useState(false);

  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  const courses = useMemo(() => {
    const byId = new Map<string, string>();

    for (const pending of classes) {
      if (!byId.has(pending.courseId)) {
        byId.set(pending.courseId, pending.courseName);
      }
    }

    return [...byId.entries()].map(([id, name]) => ({ id, name })).sort((left, right) => left.name.localeCompare(right.name, "es"));
  }, [classes]);

  const effectiveCourseId = courseId !== ALL_COURSES && courses.some((course) => course.id === courseId) ? courseId : ALL_COURSES;

  const classOptions = useMemo(() => {
    const filtered = effectiveCourseId === ALL_COURSES ? classes : classes.filter((pending) => pending.courseId === effectiveCourseId);

    return [...filtered].sort((left, right) => left.classLabel.localeCompare(right.classLabel, "es"));
  }, [classes, effectiveCourseId]);

  const effectiveClassId = classId !== ALL_CLASSES && classOptions.some((option) => option.classId === classId) ? classId : ALL_CLASSES;

  function handleCourseChange(value: string): void {
    setCourseId(value);
    setClassId(ALL_CLASSES);
  }

  const selectedClassIds = effectiveClassId === ALL_CLASSES ? classOptions.map((option) => option.classId) : [effectiveClassId];

  const totalPending = classOptions
    .filter((option) => selectedClassIds.includes(option.classId))
    .reduce((total, option) => total + option.pendingChanges, 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (isPublishing || isRefreshing || selectedClassIds.length === 0) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    setIsPublishing(true);
    onPendingChange(true);

    try {
      const formIds = formData.getAll("classId").filter((value): value is string => typeof value === "string");

      const requestedIds = [...new Set(formIds.length > 0 ? formIds : selectedClassIds)];

      const classLabels = Object.fromEntries(classes.map((entry) => [entry.classId, `${entry.courseName} · ${entry.classLabel}`]));

      const batches = chunkClassIds(requestedIds, COURSE_ENROLLMENT_GRADE_BULK_PUBLISH_LIMIT);

      const results: BulkPublishClassResult[] = [];

      let error: string | undefined;

      for (let index = 0; index < batches.length; index += 1) {
        setBatchProgress({ current: index + 1, total: batches.length });

        const batchResult = await safelyRunAction(publishBulkInstitutionalGradesAction(batches[index]), "No se pudieron publicar las notas.");

        if (!batchResult.results || batchResult.results.length === 0) {
          error ??= UNCERTAIN_BATCH_MESSAGE;
          results.push(
            ...batches[index].map((pendingClassId) => ({ classId: pendingClassId, status: "uncertain" as const, error: UNCERTAIN_BATCH_MESSAGE })),
          );

          continue;
        }

        error ??= batchResult.error;
        results.push(...batchResult.results);
      }

      const confirmed = results.filter((result) => result.status === "published").length;

      if (confirmed > 0) {
        void invalidateGradeQueries(queryClient);
        onPublished();
      }

      if (confirmed === requestedIds.length && error === undefined) {
        toast.success("Notas publicadas correctamente.");
        onOpenChange(false);
      } else {
        onReportAvailable();
        onRefreshPendingClasses();
      }

      setState({ error, results, classLabels, totalClasses: requestedIds.length });
    } finally {
      setBatchProgress(null);
      setIsPublishing(false);
      onPendingChange(false);
    }
  }

  const batchLabel =
    batchProgress && batchProgress.total > 1 ? `Publicando… (lote ${batchProgress.current} de ${batchProgress.total})` : "Publicando…";

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-4">
      <div className="space-y-4">
        <Field>
          <FieldLabel htmlFor="bulk-course">Curso</FieldLabel>
          <Select value={effectiveCourseId} onValueChange={handleCourseChange} disabled={isPublishing}>
            <SelectTrigger id="bulk-course" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL_COURSES} className="px-2.5 py-1.5">
                  Todos los cursos
                </SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id} className="px-2.5 py-1.5">
                    {course.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="bulk-class">Clase</FieldLabel>
          <Select value={effectiveClassId} onValueChange={setClassId} disabled={isPublishing || effectiveCourseId === ALL_COURSES}>
            <SelectTrigger id="bulk-class" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL_CLASSES} className="px-2.5 py-1.5">
                  Todas las clases
                </SelectItem>
                {classOptions.map((option) => (
                  <SelectItem key={option.classId} value={option.classId} className="px-2.5 py-1.5">
                    {option.classLabel} · {option.pendingChanges} {option.pendingChanges === 1 ? "pendiente" : "pendientes"}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        {selectedClassIds.map((id) => (
          <input key={id} type="hidden" name="classId" value={id} />
        ))}
        <p className="text-muted-foreground text-sm">{formatPendingSummary(totalPending)}</p>
        <BulkPublishOutcome
          state={state}
          classLabels={state.classLabels ?? {}}
          totalClasses={state.totalClasses ?? 0}
          isRefreshing={isRefreshing}
          refreshError={refreshError}
          onRefreshPendingClasses={onRefreshPendingClasses}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" size="lg" disabled={isPublishing} onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" disabled={isPublishing || isRefreshing || selectedClassIds.length === 0}>
          {isPublishing ? batchLabel : "Publicar notas"}
        </Button>
      </DialogFooter>
    </form>
  );
}
