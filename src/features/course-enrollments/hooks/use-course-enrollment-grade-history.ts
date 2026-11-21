"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import type { PaginatedResponse } from "@common/types/paginated-response.types";

import {
  COURSE_ENROLLMENT_GRADE_HISTORY_PAGE_SIZE,
  COURSE_ENROLLMENT_GRADE_MESSAGES,
} from "@features/course-enrollments/constants/course-enrollment-grade.constants";
import { GRADE_MANAGEMENT_MODE, type GradeManagementMode } from "@features/course-enrollments/services/course-enrollment-grade-client.service";
import {
  fetchManagementGradeHistoryClient,
  fetchTeacherGradeHistoryClient,
} from "@features/course-enrollments/services/course-enrollment-grade-history-client.service";
import type { CourseEnrollmentGradeHistoryEvent } from "@features/course-enrollments/types/course-enrollment-grade-history-event.types";
import { gradeQueryKeys } from "@features/course-enrollments/utils/course-enrollment-grade-query-keys.util";

type GradeHistoryIdentity = {
  mode: GradeManagementMode;
  enrollmentId: string;
  classId?: string;
  gradeId: string;
};

const EMPTY_HISTORY_PAGE: PaginatedResponse<CourseEnrollmentGradeHistoryEvent> = {
  items: [],
  page: 0,
  size: COURSE_ENROLLMENT_GRADE_HISTORY_PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
};

export function useCourseEnrollmentGradeHistory({ mode, enrollmentId, classId, gradeId }: GradeHistoryIdentity) {
  const [page, setPage] = useState(0);

  const [size, setSize] = useState(COURSE_ENROLLMENT_GRADE_HISTORY_PAGE_SIZE);

  const query = useQuery({
    queryKey: gradeQueryKeys.history(mode, enrollmentId, gradeId, classId, page, size),
    queryFn: async ({ signal }) => {
      if (mode === GRADE_MANAGEMENT_MODE.TEACHER && classId) {
        return fetchTeacherGradeHistoryClient(classId, enrollmentId, gradeId, page, size, signal);
      }

      return fetchManagementGradeHistoryClient(enrollmentId, gradeId, page, size, signal);
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    placeholderData: (previous) => previous,
    meta: { refreshOnReturn: true },
  });

  return {
    page,
    size,
    loading: query.isFetching,
    error: query.isError && !query.isFetching ? COURSE_ENROLLMENT_GRADE_MESSAGES.LOAD_FAILED : "",
    history: query.data ?? EMPTY_HISTORY_PAGE,
    retry: () => void query.refetch(),
    changePage: (nextPage: number) => setPage(nextPage),
    changeSize: (nextSize: number) => {
      setPage(0);
      setSize(nextSize);
    },
  };
}
