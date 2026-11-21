import { proxyInstitutionalGradeGet } from "@features/course-enrollments/utils/grade-route-proxy.util";

export async function GET(request: Request, { params }: { params: Promise<{ classId: string; enrollmentId: string }> }): Promise<Response> {
  const { classId, enrollmentId } = await params;

  return proxyInstitutionalGradeGet(
    request,
    (institutionId) => `/api/v1/institutions/${institutionId}/teacher/classes/${classId}/enrollments/${enrollmentId}/grades/archived`,
    { uuids: [classId, enrollmentId] },
  );
}
