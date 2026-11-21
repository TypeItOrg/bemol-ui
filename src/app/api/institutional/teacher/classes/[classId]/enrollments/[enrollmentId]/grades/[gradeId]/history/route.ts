import { proxyInstitutionalGradeGet } from "@features/course-enrollments/utils/grade-route-proxy.util";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ classId: string; enrollmentId: string; gradeId: string }> },
): Promise<Response> {
  const { classId, enrollmentId, gradeId } = await params;

  return proxyInstitutionalGradeGet(
    request,
    (institutionId) => `/api/v1/institutions/${institutionId}/teacher/classes/${classId}/enrollments/${enrollmentId}/grades/${gradeId}/history`,
    { uuids: [classId, enrollmentId, gradeId], allowPaginationQuery: true },
  );
}
