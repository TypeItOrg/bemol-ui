import { cache } from "react";

import "server-only";

import { getRequestInstitution } from "@common/services/institutional-host/institutional-host.service";

import { getInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { fetchInstitutionalInstitution } from "@features/institutions/services/fetch-institutional-institution.service";
import type { PublicInstitution } from "@features/institutions/types/public-institution.types";

async function resolveInstitutionalBrand(): Promise<Pick<PublicInstitution, "id" | "logoUrl"> | undefined> {
  const requestInstitution = await getRequestInstitution();

  if (requestInstitution) {
    return requestInstitution;
  }

  const user = await getInstitutionalUser();

  if (!user) {
    return undefined;
  }

  try {
    const institution = await fetchInstitutionalInstitution(user.institutionId);

    if (!institution) {
      return undefined;
    }

    return {
      id: institution.id,
      logoUrl: institution.logoUrl,
    };
  } catch {
    return undefined;
  }
}

export const getInstitutionalBrand = cache(resolveInstitutionalBrand);
