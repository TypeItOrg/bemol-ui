import { proxyInstitutionalGradeGet } from "@features/course-enrollments/utils/grade-route-proxy.util";

export async function GET(request: Request, { params }: { params: Promise<{ personId: string; enrollmentId: string }> }): Promise<Response> {
  const { personId, enrollmentId } = await params;

  return proxyInstitutionalGradeGet(
    request,
    (institutionId) => `/api/v1/institutions/${institutionId}/self-service/${personId}/courses/${enrollmentId}/grades`,
    { uuids: [personId, enrollmentId] },
  );
}
