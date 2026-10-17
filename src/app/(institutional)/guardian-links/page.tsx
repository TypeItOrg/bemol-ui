import type { ReactElement } from "react";

import type { Metadata } from "next";

import { UsersIcon } from "lucide-react";

import { DataTableNavigationProvider } from "@common/components/ui/data-table-navigation";

import { GuardianLinkRequests } from "@features/guardian-links/components/guardian-link-requests";
import { fetchGuardianLinkRequestsPage } from "@features/guardian-links/services/guardian-link.service";
import { parseGuardianLinksQuery } from "@features/guardian-links/utils/guardian-links-query.util";
import { InstitutionalAccessDenied } from "@features/institutional-auth/components/institutional-access-denied";
import { InstitutionalBreadcrumb } from "@features/institutional-auth/components/institutional-breadcrumb";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { canReviewGuardianLinks } from "@features/institutional-auth/utils/institutional-applicant-role.util";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Vinculaciones");
}

type GuardianLinksPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function GuardianLinksPage({ searchParams }: GuardianLinksPageProps): Promise<ReactElement> {
  const user = await requireInstitutionalUser();

  if (!canReviewGuardianLinks(user)) {
    return <InstitutionalAccessDenied description="No tenés permisos para validar vinculaciones." />;
  }

  const query = parseGuardianLinksQuery(await searchParams);

  let data = await fetchGuardianLinkRequestsPage(user.institutionId, query);

  if (query.page > 0 && query.page >= data.totalPages) {
    query.page = Math.max(0, data.totalPages - 1);
    data = await fetchGuardianLinkRequestsPage(user.institutionId, query);
  }

  return (
    <PlatformPageShell title="Vinculaciones" breadcrumb={<InstitutionalBreadcrumb />} actions={<PlatformPageIcon icon={UsersIcon} />}>
      <DataTableNavigationProvider>
        <GuardianLinkRequests institutionId={user.institutionId} data={data} query={query} />
      </DataTableNavigationProvider>
    </PlatformPageShell>
  );
}
