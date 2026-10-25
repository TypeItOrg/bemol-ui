import type { ReactElement } from "react";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClipboardListIcon } from "lucide-react";

import { DataTableNavigationProvider } from "@common/components/ui/data-table-navigation";

import { CourseWaitlistTable } from "@features/course-enrollments/components/course-waitlist-table";
import { fetchCourseWaitlist, fetchCourseWaitlistOptions } from "@features/course-enrollments/services/course-enrollment.service";
import { parseCourseWaitlistFilters } from "@features/course-enrollments/utils/course-waitlist-filters.util";
import { InstitutionalBreadcrumb } from "@features/institutional-auth/components/institutional-breadcrumb";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import { hasTrainingPathPermission } from "@features/institutional-auth/utils/institutional-permission.util";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export const metadata: Metadata = { title: "Lista de espera", other: { "application-title": "Lista de espera" } };

export default async function CourseWaitlistPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<ReactElement> {
  const user = await requireInstitutionalUser();

  const [{ id }, query] = await Promise.all([params, searchParams]);

  const parsed = parseCourseWaitlistFilters(query);

  if (!parsed.success) {
    notFound();
  }

  const [entries, options] = await Promise.all([
    fetchCourseWaitlist(user.institutionId, id, parsed.data),
    fetchCourseWaitlistOptions("institutional", user.institutionId, id),
  ]);

  if (!entries || !options) {
    notFound();
  }

  return (
    <PlatformPageShell
      title="Lista de espera"
      breadcrumb={
        <InstitutionalBreadcrumb
          segmentLabels={{ "course-enrollments": "Cursos", [id]: options.courseName }}
          segmentHrefs={{ "course-enrollments": "/courses", [id]: `/courses/${id}` }}
        />
      }
      actions={<PlatformPageIcon icon={ClipboardListIcon} />}
    >
      <DataTableNavigationProvider>
        <CourseWaitlistTable
          entries={entries}
          filters={parsed.data}
          preferredShifts={options.preferredShifts}
          canEnroll={hasTrainingPathPermission(user, INSTITUTIONAL_PERMISSION.ENROLLMENT_APPLICATION_COURSE_ENROLL, options.trainingPathId)}
        />
      </DataTableNavigationProvider>
    </PlatformPageShell>
  );
}
