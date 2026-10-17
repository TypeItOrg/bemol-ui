import "server-only";

import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { parseHttpResponse } from "@common/utils/http-response-error.util";

import type { Shift } from "@features/academic/types/shift.types";
import type { TrainingPath } from "@features/academic/types/training-path.types";
import { ENROLLMENT_MESSAGES } from "@features/enrollment-applications/constants/enrollment-messages.constants";
import type { EnrollmentCourseOption } from "@features/enrollment-applications/types/enrollment-course-option.types";
import { getSelfServiceEnrollmentApiPath } from "@features/guardian-workspace/services/operating-profile.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";

export async function fetchEnrollmentApplicationShifts(applicationId: string, personId?: string): Promise<Shift[]> {
  const response = await institutionalApiFetch(`${await getSelfServiceEnrollmentApiPath(personId)}/${applicationId}/shifts`, {
    method: "GET",
  });

  return parseHttpResponse<Shift[]>(response, ENROLLMENT_MESSAGES.FETCH_SHIFTS_FAILED);
}

export async function fetchEnrollmentApplicationCourses(
  applicationId: string,
  params: { page?: number; size?: number; search?: string } = {},
  personId?: string,
): Promise<PaginatedResponse<EnrollmentCourseOption>> {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 0),
    size: String(params.size ?? 50),
  });

  if (params.search) {
    searchParams.set("search", params.search);
  }

  const response = await institutionalApiFetch(
    `${await getSelfServiceEnrollmentApiPath(personId)}/${applicationId}/courses?${searchParams.toString()}`,
    {
      method: "GET",
    },
  );

  return parseHttpResponse(response, ENROLLMENT_MESSAGES.FETCH_COURSES_FAILED);
}

export async function fetchAvailableEnrollmentTrainingPaths(
  params: { page?: number; size?: number } = {},
  personId?: string,
): Promise<PaginatedResponse<TrainingPath>> {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 0),
    size: String(params.size ?? 20),
  });

  const response = await institutionalApiFetch(
    `${await getSelfServiceEnrollmentApiPath(personId)}/options/training-paths?${searchParams.toString()}`,
    {
      method: "GET",
    },
  );

  return parseHttpResponse(response, ENROLLMENT_MESSAGES.FETCH_AVAILABLE_TRAINING_PATHS_FAILED);
}
