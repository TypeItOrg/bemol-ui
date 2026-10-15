import { parseHttpResponse } from "@common/utils/http-response-error.util";

import { COURSE_ENROLLMENT_GRADE_MESSAGES } from "@features/course-enrollments/constants/course-enrollment-grade.constants";
import type { CourseEnrollmentArchivedGrade } from "@features/course-enrollments/types/course-enrollment-archived-grade.types";
import type { CourseEnrollmentGradeHistoryEvent } from "@features/course-enrollments/types/course-enrollment-grade-history-event.types";

type HistoryPage = {
  content: CourseEnrollmentGradeHistoryEvent[];
};

export async function fetchManagementGradeHistoryClient(enrollmentId: string, gradeId: string): Promise<CourseEnrollmentGradeHistoryEvent[]> {
  const response = await fetch(`/api/course-enrollments/${enrollmentId}/grades/${gradeId}/history?size=50`, {
    cache: "no-store",
  });

  const page = await parseHttpResponse<HistoryPage | CourseEnrollmentGradeHistoryEvent[]>(response, COURSE_ENROLLMENT_GRADE_MESSAGES.LOAD_FAILED);

  if (Array.isArray(page)) {
    return page;
  }

  return page.content ?? [];
}

export async function fetchManagementArchivedGradesClient(enrollmentId: string): Promise<CourseEnrollmentArchivedGrade[]> {
  const response = await fetch(`/api/course-enrollments/${enrollmentId}/grades/archived`, {
    cache: "no-store",
  });

  return parseHttpResponse(response, COURSE_ENROLLMENT_GRADE_MESSAGES.LOAD_FAILED);
}

export async function fetchTeacherGradeHistoryClient(
  classId: string,
  enrollmentId: string,
  gradeId: string,
): Promise<CourseEnrollmentGradeHistoryEvent[]> {
  const response = await fetch(`/api/teacher/classes/${classId}/enrollments/${enrollmentId}/grades/${gradeId}/history?size=50`, {
    cache: "no-store",
  });

  const page = await parseHttpResponse<HistoryPage | CourseEnrollmentGradeHistoryEvent[]>(response, COURSE_ENROLLMENT_GRADE_MESSAGES.LOAD_FAILED);

  if (Array.isArray(page)) {
    return page;
  }

  return page.content ?? [];
}

export async function fetchTeacherArchivedGradesClient(classId: string, enrollmentId: string): Promise<CourseEnrollmentArchivedGrade[]> {
  const response = await fetch(`/api/teacher/classes/${classId}/enrollments/${enrollmentId}/grades/archived`, { cache: "no-store" });

  return parseHttpResponse(response, COURSE_ENROLLMENT_GRADE_MESSAGES.LOAD_FAILED);
}
