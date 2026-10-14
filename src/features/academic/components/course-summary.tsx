import type { ReactElement } from "react";

import { CourseClassesSummary } from "@features/academic/components/course-classes-summary";
import { CourseInformationSummary } from "@features/academic/components/course-information-summary";
import type { Course } from "@features/academic/types/course.types";
import type { CourseEnrollmentAssignmentOptions } from "@features/course-enrollments/types/course-enrollment-assignment-options.types";

export function CourseSummary({ course, availability }: { course: Course; availability?: CourseEnrollmentAssignmentOptions }): ReactElement {
  return (
    <>
      <CourseInformationSummary course={course} />

      <CourseClassesSummary course={course} availability={availability} />
    </>
  );
}
