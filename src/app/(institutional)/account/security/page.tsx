import { Suspense, type ReactElement } from "react";

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { InfoIcon, MonitorIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";
import { Alert, AlertDescription } from "@common/components/ui/alert";
import { DataTableNavigationProvider } from "@common/components/ui/data-table-navigation";
import type { PaginationSearchParams } from "@common/types/pagination-search-params.types";

import { InstitutionalPasswordSettings } from "@features/institutional-auth/components/institutional-password-settings";
import { InstitutionalSessionsTableContainer } from "@features/institutional-auth/components/institutional-sessions-table-container";
import { InstitutionalSessionsTableSkeleton } from "@features/institutional-auth/components/institutional-sessions-table-skeleton";
import { PasskeyManager } from "@features/institutional-auth/components/passkey-manager";
import { fetchInstitutionalSessions } from "@features/institutional-auth/services/fetch-institutional-sessions.service";
import { fetchPasskeys } from "@features/institutional-auth/services/fetch-passkeys.service";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { getCredentialManagementMessage } from "@features/institutional-auth/utils/credential-management-message.util";
import { canViewAccountSecurity } from "@features/institutional-auth/utils/institutional-applicant-role.util";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";
import { parsePasskeyFilterParams, type PasskeySearchParams } from "@features/institutional-auth/utils/passkey-query.util";
import { parseSessionsPaginationParams } from "@features/institutional-auth/utils/session-pagination.util";

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Seguridad");
}

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<PasskeySearchParams & PaginationSearchParams>;
}): Promise<ReactElement> {
  const user = await requireInstitutionalUser();

  if (!canViewAccountSecurity(user)) {
    redirect("/account/profile");
  }

  const canManageCredentials = Boolean(user.userId) && !user.delegated;

  const params = await searchParams;

  const filters = parsePasskeyFilterParams(params);

  const { page, size } = parseSessionsPaginationParams(params);

  const passkeys = canManageCredentials ? await fetchPasskeys(filters) : null;

  const sessionsPromise = fetchInstitutionalSessions({ page, size });

  return (
    <>
      {canManageCredentials ? (
        <InstitutionalPasswordSettings />
      ) : (
        <Alert>
          <InfoIcon aria-hidden="true" />
          <AlertDescription>{getCredentialManagementMessage(user)}</AlertDescription>
        </Alert>
      )}
      {passkeys ? (
        <PasskeyManager
          activePasskeys={passkeys.activePasskeys}
          initialPasskeys={passkeys.passkeys}
          maxActivePasskeys={passkeys.maxActivePasskeys}
          search={filters.search}
          sort={filters.sort}
          used={filters.used}
        />
      ) : null}
      <section id="account-sessions" className="bg-muted/25 scroll-mt-20 rounded-xl border p-4 sm:p-5">
        <header className="-mx-4 border-b px-4 pb-4 sm:-mx-5 sm:px-5 sm:pb-5">
          <SectionHeader icon={MonitorIcon} title="Sesiones" description="Revisá los dispositivos donde está abierta tu cuenta." />
        </header>
        <div className="mt-4 sm:mt-5">
          <DataTableNavigationProvider>
            <Suspense fallback={<InstitutionalSessionsTableSkeleton />}>
              <InstitutionalSessionsTableContainer dataPromise={sessionsPromise} page={page} size={size} />
            </Suspense>
          </DataTableNavigationProvider>
        </div>
      </section>
    </>
  );
}
