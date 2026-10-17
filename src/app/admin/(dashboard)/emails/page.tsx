import { Suspense, type ReactElement } from "react";

import { MailIcon } from "lucide-react";

import { DataTableNavigationProvider } from "@common/components/ui/data-table-navigation";
import { Skeleton } from "@common/components/ui/skeleton";

import { fetchInstitution } from "@features/institutions/services/fetch-institution.service";
import { AuditEventsTableContainer } from "@features/platform-audit/components/audit-events-table-container";
import { MailEventsFilters } from "@features/platform-audit/components/mail-events-filters";
import type { AuditSearchParams } from "@features/platform-audit/types/audit-search-params.types";
import { parseMailFilters } from "@features/platform-audit/utils/audit-query.util";
import { PlatformBreadcrumb } from "@features/platform-auth/components/platform-breadcrumb";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export const metadata = { title: "Correos", description: "Consultá los intentos de envío de correos de la plataforma." };

export default async function MailEventsPage({ searchParams }: { searchParams: Promise<AuditSearchParams> }): Promise<ReactElement> {
  const filters = parseMailFilters(await searchParams);

  const institution = filters.institutionId ? await fetchInstitution(filters.institutionId) : null;

  return (
    <PlatformPageShell title="Correos" breadcrumb={<PlatformBreadcrumb />} actions={<PlatformPageIcon icon={MailIcon} />}>
      <DataTableNavigationProvider>
        <MailEventsFilters filters={filters} institutionName={institution?.name} />
        {filters.dateError ? (
          <p className="text-destructive text-sm" role="alert">
            {filters.dateError}
          </p>
        ) : (
          <Suspense fallback={<Skeleton className="min-h-56 w-full flex-1 rounded-xl" role="status" aria-label="Cargando correos" />}>
            <AuditEventsTableContainer filters={filters} />
          </Suspense>
        )}
      </DataTableNavigationProvider>
    </PlatformPageShell>
  );
}
