import { proxyInstitutionalGradeGet } from "@features/course-enrollments/utils/grade-route-proxy.util";

export async function GET(request: Request): Promise<Response> {
  return proxyInstitutionalGradeGet(request, (institutionId) => `/api/v1/institutions/${institutionId}/course-classes/grades/pending-classes`);
}
