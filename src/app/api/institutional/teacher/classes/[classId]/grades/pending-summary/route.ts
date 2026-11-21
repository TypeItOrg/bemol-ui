import { proxyInstitutionalGradeGet } from "@features/course-enrollments/utils/grade-route-proxy.util";

export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }): Promise<Response> {
  const { classId } = await params;

  return proxyInstitutionalGradeGet(
    request,
    (institutionId) => `/api/v1/institutions/${institutionId}/teacher/classes/${classId}/grades/pending-summary`,
    { uuids: [classId] },
  );
}
