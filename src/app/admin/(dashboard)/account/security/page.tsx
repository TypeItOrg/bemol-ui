import type { ReactElement } from "react";

import { ShieldCheckIcon } from "lucide-react";

import { PasskeyManager } from "@features/institutional-auth/components/passkey-manager";
import type { PasskeyList } from "@features/institutional-auth/types/passkey-list.types";
import { buildPasskeyQueryString, parsePasskeyFilterParams, type PasskeySearchParams } from "@features/institutional-auth/utils/passkey-query.util";
import { PlatformBreadcrumb } from "@features/platform-auth/components/platform-breadcrumb";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";
import { PlatformPasswordSettings } from "@features/platform-auth/components/platform-password-settings";
import { platformPasskeyRequest } from "@features/platform-auth/services/platform-passkeys.service";

export const metadata = {
  title: "Seguridad",
  other: { "application-title": "Seguridad" },
  description: "Administrá tu contraseña y tus llaves de acceso.",
};

type PlatformSecurityPageProps = {
  searchParams?: Promise<PasskeySearchParams>;
};

export default async function PlatformSecurityPage({ searchParams }: PlatformSecurityPageProps): Promise<ReactElement> {
  const filters = parsePasskeyFilterParams(searchParams ? await searchParams : {});

  const { passkeys, maxActivePasskeys, activePasskeys } = await platformPasskeyRequest<PasskeyList>(buildPasskeyQueryString(filters), "GET");

  return (
    <PlatformPageShell title="Seguridad" minViewportHeight breadcrumb={<PlatformBreadcrumb />} actions={<PlatformPageIcon icon={ShieldCheckIcon} />}>
      <PlatformPasswordSettings />
      <PasskeyManager
        platform
        activePasskeys={activePasskeys}
        initialPasskeys={passkeys}
        maxActivePasskeys={maxActivePasskeys}
        search={filters.search}
        sort={filters.sort}
        used={filters.used}
      />
    </PlatformPageShell>
  );
}
