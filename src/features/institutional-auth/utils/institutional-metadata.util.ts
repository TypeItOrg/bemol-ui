import "server-only";

import type { Metadata } from "next";

import { getRequestInstitution } from "@common/services/institutional-host/institutional-host.service";

import { fetchInstitutionalPerson } from "@features/institutional-auth/services/fetch-institutional-person.service";

export async function getInstitutionalMetadata(pageTitle: string): Promise<Metadata> {
  const institution = await getRequestInstitution();

  const person = institution ? null : await fetchInstitutionalPerson();

  const institutionName = institution?.shortName?.trim() || institution?.name || person?.institutionName || "Bemol";

  return {
    other: { "application-title": pageTitle },
    title: {
      absolute: `${pageTitle} | ${institutionName}`,
    },
  };
}
