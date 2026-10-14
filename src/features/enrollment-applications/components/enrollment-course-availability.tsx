"use client";

import type { ReactElement } from "react";

import { Alert, AlertDescription } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { Skeleton } from "@common/components/ui/skeleton";

import { CourseClassSummary } from "@features/academic/components/course-class-summary";
import type { AcademicScope } from "@features/academic/utils/academic-scope.util";
import { useCourseEnrollmentOptions } from "@features/course-enrollments/hooks/use-course-enrollment-options";

export function EnrollmentCourseAvailability({
  courseId,
  institutionId,
  scope,
}: {
  courseId: string;
  institutionId?: string;
  scope: AcademicScope;
}): ReactElement {
  const { options, error, loading, refreshing, refetch } = useCourseEnrollmentOptions({
    courseId,
    institutionId,
    scope,
    refreshAvailability: true,
  });

  return (
    <section aria-label="Disponibilidad del curso" className="-mx-4 mt-4 space-y-3 border-t px-4 pt-4">
      {loading ? <Skeleton className="h-40 w-full rounded-xl" role="status" aria-label="Cargando clases y cupos" /> : null}
      {error ? (
        <Alert>
          <AlertDescription>
            <p>No se pudo actualizar la disponibilidad. {error}</p>
            <Button type="button" variant="outline" size="sm" disabled={refreshing} onClick={() => void refetch()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {!error && options?.classes.length === 0 ? <p className="text-muted-foreground text-sm">Sin clases configuradas.</p> : null}
      {!error &&
        options &&
        options.classes.map((courseClass) => (
          <CourseClassSummary key={courseClass.id} courseClass={courseClass} availability={courseClass} format={options.format} headingLevel={4} />
        ))}
    </section>
  );
}
