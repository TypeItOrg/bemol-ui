import type { ReactElement } from "react";

import type { Metadata } from "next";

import { FilePenLineIcon } from "lucide-react";

import { parsePaginationQuery } from "@common/utils/pagination-query.util";

import { EnrollmentCatalogPagination } from "@features/enrollment-applications/components/enrollment-catalog-pagination";
import { EnrollmentStart } from "@features/enrollment-applications/components/EnrollmentStart";
import { fetchAvailableEnrollmentTrainingPaths } from "@features/enrollment-applications/services/enrollment-application-options.service";
import { fetchOperatingProfile } from "@features/guardian-workspace/services/operating-profile.service";
import { InstitutionalAccessDenied } from "@features/institutional-auth/components/institutional-access-denied";
import { InstitutionalBreadcrumb } from "@features/institutional-auth/components/institutional-breadcrumb";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Nueva inscripción");
}

export default async function EnrollmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ personId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<ReactElement> {
  const { personId } = await params;

  const profile = await fetchOperatingProfile(personId);

  if (!profile.capabilities.canManageOwnEnrollmentApplications) {
    return <InstitutionalAccessDenied description="Este perfil no tiene habilitadas nuevas inscripciones." />;
  }

  const query = await searchParams;

  const pagination = parsePaginationQuery({ page: query.plansPage }, { defaultSize: 20 });

  const plans = await fetchAvailableEnrollmentTrainingPaths(pagination, personId);

  return (
    <PlatformPageShell
      title="Nueva inscripción"
      minViewportHeight
      breadcrumb={<InstitutionalBreadcrumb />}
      actions={<PlatformPageIcon icon={FilePenLineIcon} />}
    >
      <EnrollmentStart
        personId={personId}
        studyPlans={plans.items.map((plan) => ({ id: plan.id, name: plan.name, trainingPathName: plan.name }))}
        studyPlanPagination={
          plans.totalPages > 1 ? (
            <EnrollmentCatalogPagination
              page={plans.page}
              totalPages={plans.totalPages}
              parameter="plansPage"
              query={query}
              label="Páginas de planes de estudio"
            />
          ) : undefined
        }
      />
    </PlatformPageShell>
  );
}
