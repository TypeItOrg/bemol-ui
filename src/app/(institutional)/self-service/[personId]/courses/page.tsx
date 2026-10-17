import type { ReactElement } from "react";

import type { Metadata } from "next";

import { GraduationCapIcon } from "lucide-react";

import { DataTableNavigationProvider } from "@common/components/ui/data-table-navigation";
import { parseHttpResponse } from "@common/utils/http-response-error.util";

import { MySubjects } from "@features/course-enrollments/components/my-subjects";
import { fetchMyCourseEnrollments } from "@features/course-enrollments/services/course-enrollment.service";
import { COURSE_ENROLLMENT_STATUS } from "@features/course-enrollments/types/course-enrollment-status.types";
import {
  parseCourseEnrollmentPaginationParams,
  type CourseEnrollmentSearchParams,
} from "@features/course-enrollments/utils/course-enrollment-pagination.util";
import { getSelfServiceApiPath } from "@features/guardian-workspace/services/operating-profile.service";
import { InstitutionalBreadcrumb } from "@features/institutional-auth/components/institutional-breadcrumb";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export const metadata: Metadata = { title: "Mis materias" };

export default async function MyCourseEnrollmentsPage({
  searchParams,
  params,
}: {
  params: Promise<{ personId: string }>;
  searchParams: Promise<CourseEnrollmentSearchParams>;
}): Promise<ReactElement> {
  const { personId } = await params;

  await requireInstitutionalUser();

  const resolvedSearchParams = await searchParams;

  const parsed = parseCourseEnrollmentPaginationParams(resolvedSearchParams);

  const { page, size } = parsed;

  const status = parsed.status ?? COURSE_ENROLLMENT_STATUS.ENROLLED;

  const academicStatus = status === COURSE_ENROLLMENT_STATUS.ENROLLED ? undefined : parsed.academicStatus;

  const data = await fetchSelectedCourses(personId, {
    page,
    size,
    status,
    academicStatus,
  });

  const canWithdraw = false;

  const canUpdateAcademicStatus = false;

  return (
    <PlatformPageShell title="Mis materias" breadcrumb={<InstitutionalBreadcrumb />} actions={<PlatformPageIcon icon={GraduationCapIcon} />}>
      <DataTableNavigationProvider>
        <MySubjects
          data={data}
          page={page}
          size={size}
          status={status}
          academicStatus={academicStatus}
          canWithdraw={canWithdraw}
          canUpdateAcademicStatus={canUpdateAcademicStatus}
        />
      </DataTableNavigationProvider>
    </PlatformPageShell>
  );
}

async function fetchSelectedCourses(
  personId: string,
  params: Parameters<typeof fetchMyCourseEnrollments>[1],
): ReturnType<typeof fetchMyCourseEnrollments> {
  const query = new URLSearchParams(
    Object.entries(params ?? {})
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );

  return parseHttpResponse(
    await institutionalApiFetch(`${await getSelfServiceApiPath(personId)}/courses?${query}`),
    "No se pudieron cargar los cursos.",
  );
}
