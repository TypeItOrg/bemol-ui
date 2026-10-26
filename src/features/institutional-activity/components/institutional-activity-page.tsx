import { Suspense, type ReactElement } from "react";

import { MailIcon, ScrollTextIcon } from "lucide-react";

import { DataTableNavigationProvider } from "@common/components/ui/data-table-navigation";
import { Skeleton } from "@common/components/ui/skeleton";

import { InstitutionalActivityFilters } from "@features/institutional-activity/components/institutional-activity-filters";
import { fetchInstitutionalActivity } from "@features/institutional-activity/services/institutional-activity.service";
import { parseInstitutionalActivityFilters } from "@features/institutional-activity/utils/institutional-activity-query.util";
import { InstitutionalAccessDenied } from "@features/institutional-auth/components/institutional-access-denied";
import { InstitutionalBreadcrumb } from "@features/institutional-auth/components/institutional-breadcrumb";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import { hasInstitutionalPermission } from "@features/institutional-auth/utils/institutional-permission.util";
import { AuditEventsTable } from "@features/platform-audit/components/audit-events-table";
import type { AuditFilters } from "@features/platform-audit/types/audit-filters.types";
import type { AuditSearchParams } from "@features/platform-audit/types/audit-search-params.types";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export async function InstitutionalActivityPage({ params, mailView }: { params: AuditSearchParams; mailView: boolean }): Promise<ReactElement> {
  const user = await requireInstitutionalUser();

  if (!hasInstitutionalPermission(user, mailView ? INSTITUTIONAL_PERMISSION.EMAIL_READ : INSTITUTIONAL_PERMISSION.AUDIT_READ)) {
    return <InstitutionalAccessDenied />;
  }

  const filters = parseInstitutionalActivityFilters(params, mailView);

  const title = mailView ? "Correos" : "Auditoría";

  return (
    <PlatformPageShell
      title={title}
      breadcrumb={<InstitutionalBreadcrumb />}
      actions={<PlatformPageIcon icon={mailView ? MailIcon : ScrollTextIcon} />}
    >
      <DataTableNavigationProvider>
        <InstitutionalActivityFilters filters={filters} />
        {filters.dateError ? (
          <p className="text-destructive text-sm" role="alert">
            {filters.dateError}
          </p>
        ) : (
          <Suspense
            fallback={<Skeleton className="min-h-56 w-full flex-1 rounded-xl" role="status" aria-label={`Cargando ${title.toLowerCase()}`} />}
          >
            <InstitutionalActivityTable institutionId={user.institutionId} filters={filters} />
          </Suspense>
        )}
      </DataTableNavigationProvider>
    </PlatformPageShell>
  );
}

async function InstitutionalActivityTable({ institutionId, filters }: { institutionId: string; filters: AuditFilters }): Promise<ReactElement> {
  let data = await fetchInstitutionalActivity(institutionId, filters);

  if (filters.page > 0 && filters.page >= data.totalPages) {
    data = await fetchInstitutionalActivity(institutionId, { ...filters, page: Math.max(0, data.totalPages - 1) });
  }

  const mailView = filters.module === "EMAILS";

  const hasFilters = Object.entries(filters).some(
    ([key, value]) => !["page", "size", "dateError"].includes(key) && !(mailView && key === "module") && value !== undefined,
  );

  return (
    <AuditEventsTable
      data={data}
      hasFilters={hasFilters}
      mailView={mailView}
      basePath={mailView ? "/emails" : "/audit-events"}
      showInstitution={false}
    />
  );
}
