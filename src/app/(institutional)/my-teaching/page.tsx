import type { ReactElement } from "react";

import { GraduationCapIcon } from "lucide-react";

import { DataTableNavigationProvider } from "@common/components/ui/data-table-navigation";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@common/components/ui/empty";

import { CourseEnrollmentPagination } from "@features/course-enrollments/components/course-enrollment-pagination";
import { TeacherClassCard } from "@features/course-enrollments/components/teacher-class-card";
import { fetchTeacherClasses } from "@features/course-enrollments/services/teacher-course.service";
import {
  COURSE_ENROLLMENT_PAGE_SIZE_OPTIONS,
  parseCourseEnrollmentPaginationParams,
  type CourseEnrollmentSearchParams,
} from "@features/course-enrollments/utils/course-enrollment-pagination.util";
import { InstitutionalAccessDenied } from "@features/institutional-auth/components/institutional-access-denied";
import { InstitutionalBreadcrumb } from "@features/institutional-auth/components/institutional-breadcrumb";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export const metadata = { title: "Mis clases", other: { "application-title": "Mis clases" } };

export default async function MyTeachingPage({ searchParams }: { searchParams: Promise<CourseEnrollmentSearchParams> }): Promise<ReactElement> {
  const user = await requireInstitutionalUser();

  if (!user.capabilities.canViewTeaching) {
    return <InstitutionalAccessDenied description="Esta vista corresponde a profesores con clases asignadas." />;
  }

  const { page, size } = parseCourseEnrollmentPaginationParams(await searchParams);

  const data = await fetchTeacherClasses(user.institutionId, page, size);

  return (
    <PlatformPageShell title="Mis clases" breadcrumb={<InstitutionalBreadcrumb />} actions={<PlatformPageIcon icon={GraduationCapIcon} />}>
      <DataTableNavigationProvider>
        {data.items.length === 0 ? (
          <Empty className="bg-muted/25 min-h-56 flex-1 rounded-lg border border-solid">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <GraduationCapIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Todavía no tenés clases asignadas</EmptyTitle>
              <EmptyDescription>Cuando la institución te asigne una clase, podrás consultar sus horarios y estudiantes acá.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-4 @3xl/page-shell:grid-cols-2 @6xl/page-shell:grid-cols-3">
            {data.items.map((item) => (
              <TeacherClassCard key={item.courseClass.id} item={item} />
            ))}
          </div>
        )}
        {data.totalPages > 1 || page > 0 || size !== COURSE_ENROLLMENT_PAGE_SIZE_OPTIONS[0] ? (
          <CourseEnrollmentPagination page={page} size={size} totalItems={data.totalItems} totalPages={data.totalPages} itemLabel="clases" />
        ) : null}
      </DataTableNavigationProvider>
    </PlatformPageShell>
  );
}
