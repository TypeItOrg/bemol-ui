import type { ReactElement } from "react";

import type { Metadata } from "next";

import { InstitutionalAccessDenied } from "@features/institutional-auth/components/institutional-access-denied";
import { InstitutionalAccountHeader } from "@features/institutional-auth/components/institutional-account-header";
import { PasskeyManager } from "@features/institutional-auth/components/passkey-manager";
import { fetchPasskeys } from "@features/institutional-auth/services/fetch-passkeys.service";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";
import { parsePasskeyFilterParams, type PasskeySearchParams } from "@features/institutional-auth/utils/passkey-query.util";

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Llaves de acceso");
}

type PasskeysPageProps = {
  searchParams?: Promise<PasskeySearchParams>;
};

export default async function PasskeysPage({ searchParams }: PasskeysPageProps): Promise<ReactElement> {
  const user = await requireInstitutionalUser();

  if (!user.userId || user.delegated) {
    return <InstitutionalAccessDenied description="Las credenciales personales solo se gestionan desde la cuenta de su titular." />;
  }

  const filters = parsePasskeyFilterParams(searchParams ? await searchParams : {});

  const { passkeys, maxActivePasskeys, activePasskeys } = await fetchPasskeys(filters);

  return (
    <>
      <InstitutionalAccountHeader />
      <PasskeyManager
        activePasskeys={activePasskeys}
        initialPasskeys={passkeys}
        maxActivePasskeys={maxActivePasskeys}
        search={filters.search}
        sort={filters.sort}
        used={filters.used}
      />
    </>
  );
}
