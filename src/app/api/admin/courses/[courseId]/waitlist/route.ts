import { NextRequest } from "next/server";

import { createPassthroughResponse } from "@common/utils/create-passthrough-response.util";

import { createCourseWaitlistSearchParams, parseCourseWaitlistFilters } from "@features/course-enrollments/utils/course-waitlist-filters.util";
import { requirePlatformAccount } from "@features/platform-auth/services/get-platform-account.service";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

export async function GET(request: NextRequest, context: { params: Promise<{ courseId: string }> }): Promise<Response> {
  await requirePlatformAccount();

  const { courseId } = await context.params;

  const institutionId = request.nextUrl.searchParams.get("institutionId");

  const parsed = parseCourseWaitlistFilters(Object.fromEntries(request.nextUrl.searchParams));

  if (!parsed.success) {
    return Response.json({ message: "Los filtros de la lista de espera no son válidos." }, { status: 400 });
  }

  const query = createCourseWaitlistSearchParams(parsed.data);

  const response = await platformApiFetch(`/api/v1/institutions/${institutionId}/courses/${courseId}/waitlist?${query}`);

  return createPassthroughResponse(response);
}
