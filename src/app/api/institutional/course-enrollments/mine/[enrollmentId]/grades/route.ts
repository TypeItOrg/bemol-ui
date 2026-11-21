import { proxyInstitutionalGradeGet } from "@features/course-enrollments/utils/grade-route-proxy.util";

export async function GET(request: Request, { params }: { params: Promise<{ enrollmentId: string }> }): Promise<Response> {
  const { enrollmentId } = await params;

  return proxyInstitutionalGradeGet(
    request,
    (institutionId) => `/api/v1/institutions/${institutionId}/course-enrollments/mine/${enrollmentId}/grades`,
    { uuids: [enrollmentId] },
  );
}
