import type { ReactElement } from "react";

import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@common/components/ui/button";
import { DataTableNavigationProvider } from "@common/components/ui/data-table-navigation";
import type { QueryParamValue } from "@common/types/query-param.types";
import { isValidUuid } from "@common/utils/action-argument.util";
import { getSafeReturnTo } from "@common/utils/return-to.util";

import { CourseEnrollmentTable } from "@features/course-enrollments/components/course-enrollment-table";
import { fetchTeacherClass, fetchTeacherClassEnrollments } from "@features/course-enrollments/services/teacher-course.service";
import {
  parseCourseEnrollmentPaginationParams,
  type CourseEnrollmentSearchParams,
} from "@features/course-enrollments/utils/course-enrollment-pagination.util";
import { InstitutionalAccessDenied } from "@features/institutional-auth/components/institutional-access-denied";
import { InstitutionalBreadcrumb } from "@features/institutional-auth/components/institutional-breadcrumb";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export const metadata = { title: "Cursadas", other: { "application-title": "Cursadas" } };

export default async function TeacherClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<CourseEnrollmentSearchParams & { returnTo?: QueryParamValue }>;
}): Promise<ReactElement> {
  const user = await requireInstitutionalUser();

  if (!user.capabilities.canViewTeaching) {
    return <InstitutionalAccessDenied description="Esta vista corresponde a profesores con clases asignadas." />;
  }

  const { classId } = await params;

  if (!isValidUuid(classId)) {
    notFound();
  }

  const query = await searchParams;

  const { page, size } = parseCourseEnrollmentPaginationParams(query);

  const returnTo = getSafeReturnTo(query.returnTo, "/my-teaching");

  const [teacherClass, data] = await Promise.all([
    fetchTeacherClass(user.institutionId, classId),
    fetchTeacherClassEnrollments(user.institutionId, classId, page, size),
  ]);

  return (
    <PlatformPageShell
      title={teacherClass.academicSpaceName}
      breadcrumb={<InstitutionalBreadcrumb hiddenSegments={[classId]} segmentLabels={{ classes: teacherClass.academicSpaceName }} />}
    >
      <div className="flex items-center">
        <Button asChild variant="outline" size="lg">
          <Link href={returnTo}>Volver</Link>
        </Button>
      </div>
      <DataTableNavigationProvider>
        <CourseEnrollmentTable
          data={data}
          page={page}
          size={size}
          emptyMessage="Esta clase todavía no tiene cursadas."
          detailBasePath={`/my-teaching/classes/${classId}/enrollments`}
          canUpdateAcademicStatus={user.capabilities.canUpdateTeachingAcademicStatus}
          teacherClassId={classId}
        />
      </DataTableNavigationProvider>
    </PlatformPageShell>
  );
}
