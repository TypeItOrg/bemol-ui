import type { QueryClient } from "@tanstack/react-query";

import type { GradeManagementMode } from "@features/course-enrollments/services/course-enrollment-grade-client.service";

export const GRADE_QUERY_ROOT = ["course-enrollment-grades"] as const;

export const gradeQueryKeys = {
  all: GRADE_QUERY_ROOT,
  enrollment: (mode: GradeManagementMode, enrollmentId: string, classId?: string) =>
    [...GRADE_QUERY_ROOT, "list", mode, enrollmentId, classId ?? ""] as const,
  archived: (mode: GradeManagementMode, enrollmentId: string, classId?: string) =>
    [...GRADE_QUERY_ROOT, "archived", mode, enrollmentId, classId ?? ""] as const,
  history: (mode: GradeManagementMode, enrollmentId: string, gradeId: string, classId: string | undefined, page: number, size: number) =>
    [...GRADE_QUERY_ROOT, "history", mode, enrollmentId, classId ?? "", gradeId, page, size] as const,
  pendingSummary: (mode: GradeManagementMode, classId: string) => [...GRADE_QUERY_ROOT, "pending-summary", mode, classId] as const,
  pendingClasses: () => [...GRADE_QUERY_ROOT, "pending-classes"] as const,
  student: (enrollmentId: string, personId?: string) => [...GRADE_QUERY_ROOT, "student", personId ?? "mine", enrollmentId] as const,
};

export function invalidateGradeQueries(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: GRADE_QUERY_ROOT });
}
