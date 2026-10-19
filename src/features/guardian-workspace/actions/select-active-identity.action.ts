"use server";

import { isValidUuid } from "@common/utils/action-argument.util";
import { getResponseErrorActionState } from "@common/utils/action-state.util";
import { getSafeReturnTo } from "@common/utils/return-to.util";

import type { ActiveIdentityState } from "@features/guardian-workspace/types/active-identity-state.types";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";

export async function selectActiveIdentityAction(_previous: ActiveIdentityState, formData: FormData): Promise<ActiveIdentityState> {
  const personId = formData.get("personId");

  if (personId !== "self" && !isValidUuid(personId)) {
    return { error: "La identidad seleccionada no es válida." };
  }

  const requestedReturnTo = formData.get("returnTo");

  if (requestedReturnTo !== null && typeof requestedReturnTo !== "string") {
    return { error: "El destino no es válido." };
  }

  const returnTo = getSafeReturnTo(requestedReturnTo ?? undefined, "/");

  const error = await getResponseErrorActionState(
    institutionalApiFetch("/api/v1/auth/active-identity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId: personId === "self" ? null : personId }),
    }),
    [],
    "No se pudo cambiar de identidad. Intentá nuevamente.",
  );

  return error ?? { success: true, returnTo };
}
