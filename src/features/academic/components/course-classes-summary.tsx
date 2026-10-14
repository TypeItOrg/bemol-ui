import type { ReactElement } from "react";

import { CalendarDaysIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";
import { Alert, AlertDescription } from "@common/components/ui/alert";

import { CourseClassSummary } from "@features/academic/components/course-class-summary";
import type { Course } from "@features/academic/types/course.types";
import type { CourseEnrollmentAssignmentOptions } from "@features/course-enrollments/types/course-enrollment-assignment-options.types";

export function CourseClassesSummary({ course, availability }: { course: Course; availability?: CourseEnrollmentAssignmentOptions }): ReactElement {
  return (
    <section aria-labelledby="course-classes-title" className="bg-muted/25 rounded-xl border p-5 md:p-6">
      <header className="-mx-5 border-b px-5 pb-5 md:-mx-6 md:px-6">
        <SectionHeader
          icon={CalendarDaysIcon}
          title="Clases"
          description={
            course.classes.length === 0
              ? "Este curso aún no tiene clases registradas."
              : `${course.classes.length} ${course.classes.length === 1 ? "clase registrada" : "clases registradas"}.`
          }
          titleId="course-classes-title"
        />
      </header>

      <div className="flex flex-col gap-4 pt-5">
        {!availability && course.classes.length > 0 ? (
          <Alert>
            <AlertDescription>No se pudo consultar la disponibilidad. Recargá la página para volver a intentar.</AlertDescription>
          </Alert>
        ) : null}
        {course.classes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin clases para mostrar.</p>
        ) : (
          course.classes.map((courseClass) => (
            <CourseClassSummary
              key={courseClass.id}
              courseClass={{ ...courseClass, label: `Clase ${courseClass.classNumber}` }}
              availability={availability?.classes.find((item) => item.id === courseClass.id)}
              format={course.academicSpaceFormat}
            />
          ))
        )}
      </div>
    </section>
  );
}
