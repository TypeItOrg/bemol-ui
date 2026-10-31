import { Suspense, type ReactElement } from "react";

import { redirect } from "next/navigation";

import { ScrollTextIcon } from "lucide-react";

import { DataTableNavigationProvider } from "@common/components/ui/data-table-navigation";
import { Skeleton } from "@common/components/ui/skeleton";
import { getQueryParamValue } from "@common/utils/query-param.util";

import { fetchInstitution } from "@features/institutions/services/fetch-institution.service";
import { AuditEventsFilters } from "@features/platform-audit/components/audit-events-filters";
import { AuditEventsTableContainer } from "@features/platform-audit/components/audit-events-table-container";
import { fetchAuditEvents, fetchSelectedAuditPerson } from "@features/platform-audit/services/fetch-audit-events.service";
import type { AuditFilters } from "@features/platform-audit/types/audit-filters.types";
import type { AuditSearchParams } from "@features/platform-audit/types/audit-search-params.types";
import { parseAuditFilters } from "@features/platform-audit/utils/audit-query.util";
import { PlatformBreadcrumb } from "@features/platform-auth/components/platform-breadcrumb";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export const metadata = {
  title: "Auditoría",
  other: { "application-title": "Auditoría" },
  description: "Consultá la actividad registrada en toda la plataforma.",
};

export default async function AuditEventsPage({ searchParams }: { searchParams: Promise<AuditSearchParams> }): Promise<ReactElement> {
  const params = await searchParams;

  if (getQueryParamValue(params.module) === "EMAILS") {
    const query = new URLSearchParams();

    for (const key of ["page", "size", "search", "action", "mailType", "institutionId", "requestId", "from", "to"]) {
      const value = getQueryParamValue(params[key]);

      if (value) {
        query.set(key, value);
      }
    }

    redirect(`/emails?${query}`);
  }

  const filters = parseAuditFilters(params);

  const [institution, selectedActorLabel, person] = await Promise.all([
    filters.institutionId ? fetchInstitution(filters.institutionId) : null,
    getSelectedActorLabel(filters),
    fetchSelectedAuditPerson(filters),
  ]);

  return (
    <PlatformPageShell title="Auditoría" breadcrumb={<PlatformBreadcrumb />} actions={<PlatformPageIcon icon={ScrollTextIcon} />}>
      <DataTableNavigationProvider>
        <AuditEventsFilters
          filters={filters}
          institutionName={institution?.name}
          selectedActorLabel={selectedActorLabel}
          selectedPersonLabel={person?.label}
        />
        {filters.dateError ? (
          <p className="text-destructive text-sm" role="alert">
            {filters.dateError}
          </p>
        ) : (
          <Suspense fallback={<Skeleton className="min-h-56 w-full flex-1 rounded-xl" role="status" aria-label="Cargando auditoría" />}>
            <AuditEventsTableContainer filters={filters} />
          </Suspense>
        )}
      </DataTableNavigationProvider>
    </PlatformPageShell>
  );
}

async function getSelectedActorLabel(filters: AuditFilters): Promise<string | undefined> {
  if (!filters.actorKind || !filters.actorId) {
    return undefined;
  }

  const data = await fetchAuditEvents({ page: 0, size: 1, actorKind: filters.actorKind, actorId: filters.actorId });

  return data.items[0]?.actorName ?? "Actor eliminado o no disponible";
}
