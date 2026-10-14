import type { ReactElement } from "react";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClipboardListIcon } from "lucide-react";

import { DataTableNavigationProvider } from "@common/components/ui/data-table-navigation";

import { CourseWaitlistTable } from "@features/course-enrollments/components/course-waitlist-table";
import { fetchCourseWaitlistOptions, fetchPlatformCourseWaitlist } from "@features/course-enrollments/services/course-enrollment.service";
import { parseCourseWaitlistFilters } from "@features/course-enrollments/utils/course-waitlist-filters.util";
import { PlatformBreadcrumb } from "@features/platform-auth/components/platform-breadcrumb";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";
import { requirePlatformAccount } from "@features/platform-auth/services/get-platform-account.service";

export const metadata: Metadata = { title: "Lista de espera" };

export default async function PlatformCourseWaitlistPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<ReactElement> {
  await requirePlatformAccount();

  const [{ courseId }, query] = await Promise.all([params, searchParams]);

  const institutionId = query.institutionId;

  const parsed = parseCourseWaitlistFilters(query);

  if (typeof institutionId !== "string" || !institutionId || !parsed.success) {
    notFound();
  }

  const [entries, options] = await Promise.all([
    fetchPlatformCourseWaitlist(institutionId, courseId, parsed.data),
    fetchCourseWaitlistOptions("admin", institutionId, courseId),
  ]);

  if (!entries || !options) {
    notFound();
  }

  return (
    <PlatformPageShell
      title="Lista de espera"
      breadcrumb={
        <PlatformBreadcrumb
          segmentLabels={{ "course-enrollments": "Cursos", [courseId]: options.courseName }}
          segmentHrefs={{
            "course-enrollments": "/admin/courses",
            [courseId]: `/admin/institutions/${institutionId}/academic/courses/${courseId}`,
          }}
        />
      }
      actions={<PlatformPageIcon icon={ClipboardListIcon} />}
    >
      <DataTableNavigationProvider>
        <CourseWaitlistTable
          entries={entries}
          filters={parsed.data}
          preferredShifts={options.preferredShifts}
          institutionId={institutionId}
          scope="admin"
          canEnroll
        />
      </DataTableNavigationProvider>
    </PlatformPageShell>
  );
}
