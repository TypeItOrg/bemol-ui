import type { ReactElement } from "react";

import { notFound } from "next/navigation";

import { ScrollTextIcon } from "lucide-react";

import { isValidUuid } from "@common/utils/action-argument.util";
import { getSafeReturnTo } from "@common/utils/return-to.util";

import { CourseEnrollmentDetail } from "@features/course-enrollments/components/course-enrollment-detail";
import { CourseEnrollmentDetailActions } from "@features/course-enrollments/components/course-enrollment-detail-actions";
import {
  fetchTeacherClass,
  fetchTeacherEnrollment,
  fetchTeacherEnrollmentHistory,
} from "@features/course-enrollments/services/teacher-course.service";
import { InstitutionalAccessDenied } from "@features/institutional-auth/components/institutional-access-denied";
import { InstitutionalBreadcrumb } from "@features/institutional-auth/components/institutional-breadcrumb";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export const metadata = { title: "Detalle de cursada", other: { "application-title": "Detalle de cursada" } };

export default async function TeacherEnrollmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string; id: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}): Promise<ReactElement> {
  const user = await requireInstitutionalUser();

  if (!user.capabilities.canViewTeaching) {
    return <InstitutionalAccessDenied description="Esta vista corresponde a profesores con clases asignadas." />;
  }

  const { classId, id } = await params;

  if (!isValidUuid(classId) || !isValidUuid(id)) {
    notFound();
  }

  const returnTo = getSafeReturnTo((await searchParams).returnTo, `/my-teaching/classes/${classId}`);

  const [teacherClass, enrollment, history] = await Promise.all([
    fetchTeacherClass(user.institutionId, classId),
    fetchTeacherEnrollment(user.institutionId, classId, id),
    fetchTeacherEnrollmentHistory(user.institutionId, classId, id),
  ]);

  return (
    <PlatformPageShell
      title="Detalle de cursada"
      breadcrumb={
        <InstitutionalBreadcrumb
          hiddenSegments={["classes", "enrollments"]}
          segmentLabels={{ [classId]: teacherClass.academicSpaceName, [id]: "Detalle de cursada" }}
        />
      }
      actions={<PlatformPageIcon icon={ScrollTextIcon} />}
    >
      <CourseEnrollmentDetailActions
        enrollment={enrollment}
        returnTo={returnTo}
        canWithdraw={false}
        canReadWaitlist={false}
        canUpdateAcademicStatus={user.capabilities.canUpdateTeachingAcademicStatus}
        teacherClassId={classId}
      />
      <CourseEnrollmentDetail enrollment={enrollment} history={history} />
    </PlatformPageShell>
  );
}
