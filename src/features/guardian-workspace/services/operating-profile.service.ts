import { isValidUuid } from "@common/utils/action-argument.util";
import { parseHttpResponse } from "@common/utils/http-response-error.util";
import "server-only";

import type { OperatingProfile } from "@features/guardian-workspace/types/operating-profile.types";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";

export async function getSelfServiceApiPath(personId?: string): Promise<string> {
  const user = await requireInstitutionalUser();

  const selected = personId ?? user.personId;

  if (!isValidUuid(selected)) {
    throw new Error("La persona seleccionada no es válida.");
  }

  return `/api/v1/institutions/${user.institutionId}/self-service/${selected}`;
}

export async function getSelfServiceEnrollmentApiPath(personId?: string): Promise<string> {
  return `${await getSelfServiceApiPath(personId)}/enrollment-applications`;
}

export async function fetchOperatingProfiles(institutionId: string): Promise<OperatingProfile[]> {
  return parseHttpResponse(
    await institutionalApiFetch(`/api/v1/institutions/${institutionId}/operating-profiles`),
    "No se pudieron cargar los perfiles disponibles.",
  );
}

export async function fetchOperatingProfile(personId: string): Promise<OperatingProfile> {
  return parseHttpResponse(
    await institutionalApiFetch(await getSelfServiceApiPath(personId)),
    "No podés gestionar esta persona. La vinculación puede haber finalizado.",
  );
}
