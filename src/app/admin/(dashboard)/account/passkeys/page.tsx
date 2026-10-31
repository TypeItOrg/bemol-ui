import type { ReactElement } from "react";

import { KeyRoundIcon } from "lucide-react";

import { PasskeyManager } from "@features/institutional-auth/components/passkey-manager";
import type { PasskeyList } from "@features/institutional-auth/types/passkey-list.types";
import { buildPasskeyQueryString, parsePasskeyFilterParams, type PasskeySearchParams } from "@features/institutional-auth/utils/passkey-query.util";
import { PlatformBreadcrumb } from "@features/platform-auth/components/platform-breadcrumb";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";
import { platformPasskeyRequest } from "@features/platform-auth/services/platform-passkeys.service";

export const metadata = {
  title: "Llaves de acceso",
  other: { "application-title": "Llaves de acceso" },
  description: "Gestioná las llaves de acceso que usás para ingresar a la administración.",
};

type PlatformPasskeysPageProps = {
  searchParams?: Promise<PasskeySearchParams>;
};

export default async function PlatformPasskeysPage({ searchParams }: PlatformPasskeysPageProps): Promise<ReactElement> {
  const filters = parsePasskeyFilterParams(searchParams ? await searchParams : {});

  const { passkeys, maxActivePasskeys, activePasskeys } = await platformPasskeyRequest<PasskeyList>(buildPasskeyQueryString(filters), "GET");

  return (
    <PlatformPageShell
      title="Llaves de acceso"
      breadcrumb={<PlatformBreadcrumb hiddenSegments={["account"]} />}
      actions={<PlatformPageIcon icon={KeyRoundIcon} />}
    >
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
