"use client";

import { useActionState, useMemo, useState } from "react";
import type { ReactElement } from "react";

import { toast } from "sonner";

import { ActionForm } from "@common/components/action-form";
import { Button } from "@common/components/ui/button";
import { DialogFooter } from "@common/components/ui/dialog";
import { Field, FieldLabel } from "@common/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@common/components/ui/select";
import { safelyRunAction } from "@common/utils/safe-action.util";

import { publishBulkInstitutionalGradesAction, type BulkPublishResult } from "@features/course-enrollments/actions/publish-bulk-grades.actions";
import { BulkPublishOutcome } from "@features/course-enrollments/components/bulk-publish-grades-outcome";
import type { PendingClassGrades } from "@features/course-enrollments/types/pending-class-grades.types";
import { notifyGradesChanged } from "@features/course-enrollments/utils/course-enrollment-grade-events.util";

const ALL_COURSES = "all-courses";

const ALL_CLASSES = "all-classes";

type BulkState = BulkPublishResult & { success?: boolean };

export function BulkPublishGradesForm({
  classes,
  onOpenChange,
  onPublished,
  onPendingChange,
}: {
  classes: PendingClassGrades[];
  onOpenChange: (open: boolean) => void;
  onPublished: () => void;
  onPendingChange: (pending: boolean) => void;
}): ReactElement {
  const [courseId, setCourseId] = useState<string>(ALL_COURSES);

  const [classId, setClassId] = useState<string>(ALL_CLASSES);

  const courses = useMemo(() => {
    const byId = new Map<string, string>();

    for (const pending of classes) {
      if (!byId.has(pending.courseId)) {
        byId.set(pending.courseId, pending.courseName);
      }
    }

    return [...byId.entries()].map(([id, name]) => ({ id, name })).sort((left, right) => left.name.localeCompare(right.name, "es"));
  }, [classes]);

  const classOptions = useMemo(() => {
    const filtered = courseId === ALL_COURSES ? classes : classes.filter((pending) => pending.courseId === courseId);

    return [...filtered].sort((left, right) => left.classLabel.localeCompare(right.classLabel, "es"));
  }, [classes, courseId]);

  function handleCourseChange(value: string): void {
    setCourseId(value);
    setClassId(ALL_CLASSES);
  }

  const selectedClassIds = classId === ALL_CLASSES ? classOptions.map((option) => option.classId) : [classId];

  const totalPending = classOptions
    .filter((option) => selectedClassIds.includes(option.classId))
    .reduce((total, option) => total + option.pendingChanges, 0);

  const [state, formAction, isPublishing] = useActionState(async (_previous: BulkState, formData: FormData): Promise<BulkState> => {
    onPendingChange(true);

    try {
      const ids = formData.getAll("classId").filter((value): value is string => typeof value === "string");

      const result = await safelyRunAction(
        publishBulkInstitutionalGradesAction(ids.length > 0 ? ids : selectedClassIds),
        "No se pudieron publicar las notas.",
      );

      if (result.error && (result.publishedClasses ?? 0) === 0) {
        return result;
      }

      const failed = result.failedClasses ?? 0;

      const uncertain = result.uncertainClasses ?? 0;

      if (failed === 0 && uncertain === 0) {
        toast.success("Notas publicadas correctamente.");
        onOpenChange(false);
        notifyGradesChanged();
        onPublished();

        return { ...result, success: true };
      }

      return result;
    } finally {
      onPendingChange(false);
    }
  }, {});

  return (
    <ActionForm action={formAction} className="space-y-4">
      <div className="space-y-4">
        <Field>
          <FieldLabel htmlFor="bulk-course">Curso</FieldLabel>
          <Select value={courseId} onValueChange={handleCourseChange} disabled={isPublishing}>
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
          <Select value={classId} onValueChange={setClassId} disabled={isPublishing || courseId === ALL_COURSES}>
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
                    {option.classLabel} · {option.pendingChanges} pendientes
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        {selectedClassIds.map((id) => (
          <input key={id} type="hidden" name="classId" value={id} />
        ))}
        <p className="text-muted-foreground text-sm">
          {totalPending > 0 ? `${totalPending} cambios pendientes en la selección.` : "Sin cambios en la selección."}
        </p>
        <BulkPublishOutcome state={state} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" size="lg" disabled={isPublishing} onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" disabled={isPublishing || selectedClassIds.length === 0}>
          {isPublishing ? "Publicando…" : "Publicar notas"}
        </Button>
      </DialogFooter>
    </ActionForm>
  );
}
