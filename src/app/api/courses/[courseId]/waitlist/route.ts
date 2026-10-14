import { NextRequest } from "next/server";

import { createPassthroughResponse } from "@common/utils/create-passthrough-response.util";

import { createCourseWaitlistSearchParams, parseCourseWaitlistFilters } from "@features/course-enrollments/utils/course-waitlist-filters.util";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";

export async function GET(request: NextRequest, context: { params: Promise<{ courseId: string }> }): Promise<Response> {
  const user = await requireInstitutionalUser();

  const { courseId } = await context.params;

  const parsed = parseCourseWaitlistFilters(Object.fromEntries(request.nextUrl.searchParams));

  if (!parsed.success) {
    return Response.json({ message: "Los filtros de la lista de espera no son válidos." }, { status: 400 });
  }

  const query = createCourseWaitlistSearchParams(parsed.data);

  const response = await institutionalApiFetch(`/api/v1/institutions/${user.institutionId}/courses/${courseId}/waitlist?${query}`);

  return createPassthroughResponse(response);
}
