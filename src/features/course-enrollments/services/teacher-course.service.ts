import "server-only";

import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { parseHttpResponse } from "@common/utils/http-response-error.util";

import type { CourseEnrollmentHistory } from "@features/course-enrollments/types/course-enrollment-history.types";
import type { CourseEnrollment } from "@features/course-enrollments/types/course-enrollment.types";
import type { TeacherCourseClass } from "@features/course-enrollments/types/teacher-course-class.types";
import type { TeacherWeeklySchedules } from "@features/course-enrollments/types/teacher-weekly-schedules.types";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";

export async function fetchTeacherClasses(institutionId: string, page: number, size: number): Promise<PaginatedResponse<TeacherCourseClass>> {
  return parseHttpResponse(
    await institutionalApiFetch(`/api/v1/institutions/${institutionId}/teacher/classes?page=${page}&size=${size}`),
    "No se pudieron cargar tus clases.",
  );
}

export async function fetchTeacherClass(institutionId: string, classId: string): Promise<TeacherCourseClass> {
  return parseHttpResponse(
    await institutionalApiFetch(`/api/v1/institutions/${institutionId}/teacher/classes/${classId}`),
    "No se pudo cargar esta clase.",
  );
}

export async function fetchTeacherWeeklySchedules(institutionId: string, week: string): Promise<TeacherWeeklySchedules> {
  const params = new URLSearchParams({ week });

  return parseHttpResponse(
    await institutionalApiFetch(`/api/v1/institutions/${institutionId}/teacher/classes/schedules?${params}`),
    "No se pudieron cargar tus horarios.",
  );
}

export async function fetchTeacherClassEnrollments(
  institutionId: string,
  classId: string,
  page: number,
  size: number,
): Promise<PaginatedResponse<CourseEnrollment>> {
  return parseHttpResponse(
    await institutionalApiFetch(`/api/v1/institutions/${institutionId}/teacher/classes/${classId}/enrollments?page=${page}&size=${size}`),
    "No se pudieron cargar las cursadas de esta clase.",
  );
}

export async function fetchTeacherEnrollment(institutionId: string, classId: string, enrollmentId: string): Promise<CourseEnrollment> {
  return parseHttpResponse(
    await institutionalApiFetch(`/api/v1/institutions/${institutionId}/teacher/classes/${classId}/enrollments/${enrollmentId}`),
    "No se pudo cargar la cursada.",
  );
}

export async function fetchTeacherEnrollmentHistory(
  institutionId: string,
  classId: string,
  enrollmentId: string,
): Promise<CourseEnrollmentHistory[]> {
  return parseHttpResponse(
    await institutionalApiFetch(`/api/v1/institutions/${institutionId}/teacher/classes/${classId}/enrollments/${enrollmentId}/history`),
    "No se pudo cargar el historial de la cursada.",
  );
}
