import type { ReactElement } from "react";

import type { Metadata } from "next";

import { UsersIcon } from "lucide-react";

import { DataTableNavigationProvider } from "@common/components/ui/data-table-navigation";

import { resolvePlatformGuardianLinkAction } from "@features/guardian-links/actions/resolve-platform-guardian-link.action";
import { GuardianLinkRequests } from "@features/guardian-links/components/guardian-link-requests";
import { fetchPlatformGuardianLinkRequestsPage } from "@features/guardian-links/services/platform-guardian-link.service";
import { parseGuardianLinksQuery } from "@features/guardian-links/utils/guardian-links-query.util";
import { PlatformBreadcrumb } from "@features/platform-auth/components/platform-breadcrumb";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export const metadata: Metadata = { title: "Vinculaciones" };

type GuardianLinksPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PlatformGuardianLinksPage({ searchParams }: GuardianLinksPageProps): Promise<ReactElement> {
  const query = parseGuardianLinksQuery(await searchParams);

  let data = await fetchPlatformGuardianLinkRequestsPage(query);

  if (query.page > 0 && query.page >= data.totalPages) {
    query.page = Math.max(0, data.totalPages - 1);
    data = await fetchPlatformGuardianLinkRequestsPage(query);
  }

  return (
    <PlatformPageShell title="Vinculaciones" breadcrumb={<PlatformBreadcrumb />} actions={<PlatformPageIcon icon={UsersIcon} />}>
      <DataTableNavigationProvider>
        <GuardianLinkRequests onResolve={resolvePlatformGuardianLinkAction} data={data} query={query} showInstitution />
      </DataTableNavigationProvider>
    </PlatformPageShell>
  );
}
