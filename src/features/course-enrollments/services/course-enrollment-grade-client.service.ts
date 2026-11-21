import { parseHttpResponse } from "@common/utils/http-response-error.util";

import { COURSE_ENROLLMENT_GRADE_MESSAGES } from "@features/course-enrollments/constants/course-enrollment-grade.constants";
import type { CourseEnrollmentGrade } from "@features/course-enrollments/types/course-enrollment-grade.types";
import type { CourseEnrollmentStudentGrade } from "@features/course-enrollments/types/course-enrollment-student-grade.types";
import type { PendingGradesSummary } from "@features/course-enrollments/types/pending-grades-summary.types";
import { reloadForbiddenOperatingProfile } from "@features/guardian-workspace/utils/forbidden-operating-profile.util";

export const GRADE_MANAGEMENT_MODE = {
  INSTITUTIONAL: "institutional",
  TEACHER: "teacher",
} as const;

export type GradeManagementMode = (typeof GRADE_MANAGEMENT_MODE)[keyof typeof GRADE_MANAGEMENT_MODE];

export async function fetchManagementGradesClient(enrollmentId: string, signal?: AbortSignal): Promise<CourseEnrollmentGrade[]> {
  const response = await fetch(`/api/institutional/course-enrollments/${enrollmentId}/grades`, { cache: "no-store", signal });

  return parseHttpResponse(response, COURSE_ENROLLMENT_GRADE_MESSAGES.LOAD_FAILED);
}

export async function fetchTeacherGradesClient(classId: string, enrollmentId: string, signal?: AbortSignal): Promise<CourseEnrollmentGrade[]> {
  const response = await fetch(`/api/institutional/teacher/classes/${classId}/enrollments/${enrollmentId}/grades`, { cache: "no-store", signal });

  return parseHttpResponse(response, COURSE_ENROLLMENT_GRADE_MESSAGES.LOAD_FAILED);
}

export async function fetchTeacherPendingSummaryClient(classId: string, signal?: AbortSignal): Promise<PendingGradesSummary> {
  const response = await fetch(`/api/institutional/teacher/classes/${classId}/grades/pending-summary`, { cache: "no-store", signal });

  return parseHttpResponse(response, COURSE_ENROLLMENT_GRADE_MESSAGES.LOAD_FAILED);
}

export async function fetchClassPendingSummaryClient(classId: string, signal?: AbortSignal): Promise<PendingGradesSummary> {
  const response = await fetch(`/api/institutional/course-classes/${classId}/grades/pending-summary`, { cache: "no-store", signal });

  return parseHttpResponse(response, COURSE_ENROLLMENT_GRADE_MESSAGES.LOAD_FAILED);
}

export async function fetchStudentGradesClient(
  enrollmentId: string,
  personId?: string,
  signal?: AbortSignal,
): Promise<CourseEnrollmentStudentGrade[]> {
  const path = personId
    ? `/api/institutional/self-service/${personId}/courses/${enrollmentId}/grades`
    : `/api/institutional/course-enrollments/mine/${enrollmentId}/grades`;

  const response = await fetch(path, { cache: "no-store", signal });

  reloadForbiddenOperatingProfile(response.status, path);

  return parseHttpResponse(response, COURSE_ENROLLMENT_GRADE_MESSAGES.LOAD_FAILED);
}
