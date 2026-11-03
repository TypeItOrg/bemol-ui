import type { ReactElement } from "react";

import { redirect } from "next/navigation";

import { InstitutionalAccessDenied } from "@features/institutional-auth/components/institutional-access-denied";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { buildPasskeyQueryString, parsePasskeyFilterParams, type PasskeySearchParams } from "@features/institutional-auth/utils/passkey-query.util";

export default async function PasskeysPage({ searchParams }: { searchParams?: Promise<PasskeySearchParams> }): Promise<ReactElement> {
  const user = await requireInstitutionalUser();

  if (!user.userId || user.delegated) {
    return <InstitutionalAccessDenied description="Las credenciales personales solo se gestionan desde la cuenta de su titular." />;
  }

  const filters = parsePasskeyFilterParams(searchParams ? await searchParams : {});

  redirect(`/account/security${buildPasskeyQueryString(filters)}#account-passkeys`);
}
