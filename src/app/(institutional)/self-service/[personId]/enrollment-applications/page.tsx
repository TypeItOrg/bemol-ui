import { Suspense, type ReactElement } from "react";

import type { Metadata } from "next";

import { ClipboardListIcon } from "lucide-react";

import { DataTableNavigationProvider } from "@common/components/ui/data-table-navigation";

import { EnrollmentApplicationFilters } from "@features/enrollment-applications/components/enrollment-application-filters";
import { EnrollmentApplicationTableSkeleton } from "@features/enrollment-applications/components/enrollment-application-table-skeleton";
import { MyEnrollmentApplicationTableContainer } from "@features/enrollment-applications/components/my-enrollment-application-table";
import { fetchMyEnrollmentApplications } from "@features/enrollment-applications/services/enrollment-application.service";
import {
  parseEnrollmentApplicationPaginationParams,
  type EnrollmentApplicationSearchParams,
} from "@features/enrollment-applications/utils/enrollment-application-pagination.util";
import { InstitutionalAccessDenied } from "@features/institutional-auth/components/institutional-access-denied";
import { InstitutionalBreadcrumb } from "@features/institutional-auth/components/institutional-breadcrumb";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Mis inscripciones");
}

export default async function MyEnrollmentApplicationsPage({
  searchParams,
  params,
}: {
  params: Promise<{ personId: string }>;
  searchParams: Promise<EnrollmentApplicationSearchParams>;
}): Promise<ReactElement> {
  const user = await requireInstitutionalUser();

  if (!user.capabilities.canViewOwnEnrollmentApplications) {
    return <InstitutionalAccessDenied />;
  }

  const { personId } = await params;

  const resolvedSearchParams = await searchParams;

  const { page, size, status, pendingCourses } = parseEnrollmentApplicationPaginationParams(resolvedSearchParams);

  const dataPromise = fetchMyEnrollmentApplications(
    user.institutionId,
    {
      page,
      size,
      status,
      pendingCourses,
    },
    personId,
  );

  return (
    <PlatformPageShell title="Mis inscripciones" breadcrumb={<InstitutionalBreadcrumb />} actions={<PlatformPageIcon icon={ClipboardListIcon} />}>
      <DataTableNavigationProvider>
        <EnrollmentApplicationFilters status={status} pendingCourses={pendingCourses} size={size} />
        <Suspense fallback={<EnrollmentApplicationTableSkeleton />}>
          <MyEnrollmentApplicationTableContainer
            currentPersonId={personId}
            dataPromise={dataPromise}
            page={page}
            showApplicant={false}
            canManageApplications={user.capabilities.canManageOwnEnrollmentApplications}
            size={size}
            status={status}
            hasFilters={Boolean(status || pendingCourses !== undefined)}
          />
        </Suspense>
      </DataTableNavigationProvider>
    </PlatformPageShell>
  );
}
