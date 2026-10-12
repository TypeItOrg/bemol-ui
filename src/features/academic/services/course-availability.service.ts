import "server-only";

import { parseHttpResponse } from "@common/utils/http-response-error.util";

import { academicApiFetch } from "@features/academic/services/academic-api-fetch.service";
import type { AcademicScope } from "@features/academic/utils/academic-scope.util";
import type { CourseEnrollmentAssignmentOptions } from "@features/course-enrollments/types/course-enrollment-assignment-options.types";

export async function fetchCourseAvailability(
  scope: AcademicScope,
  institutionId: string,
  courseId: string,
): Promise<CourseEnrollmentAssignmentOptions> {
  const response = await academicApiFetch(scope, `/api/v1/institutions/${institutionId}/courses/${courseId}/enrollment-options`);

  return parseHttpResponse(response, "No se pudo consultar la disponibilidad del curso.");
}
