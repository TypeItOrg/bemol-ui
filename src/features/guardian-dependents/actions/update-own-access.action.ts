"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { getResponseErrorActionState } from "@common/utils/action-state.util";

import { getGuardianDependentsApiPath } from "@features/guardian-dependents/constants/guardian-dependent.constants";
import { authorizeGuardianAction } from "@features/guardian-dependents/utils/authorize-guardian-action.util";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";

export async function updateOwnAccess(
  institutionId: string,
  linkId: string,
  _state: { error?: string; success?: boolean },
  form: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = z
    .object({
      institutionId: z.string().uuid(),
      linkId: z.string().uuid(),
      enabled: z.enum(["true", "false"]).transform((value) => value === "true"),
      email: z.union([z.literal(""), z.string().email().max(150)]).transform((value) => value || undefined),
    })
    .safeParse({ institutionId, linkId, enabled: form.get("enabled"), email: form.get("email") ?? "" });

  if (!parsed.success) {
    return { error: "Revisá el correo y la opción de acceso seleccionada." };
  }

  const denied = await authorizeGuardianAction(institutionId);

  if (denied) {
    return denied;
  }

  const failure = await getResponseErrorActionState(
    institutionalApiFetch(`${getGuardianDependentsApiPath(institutionId)}/${linkId}/own-access`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: parsed.data.enabled, email: parsed.data.email }),
    }),
    [],
    "No se pudo modificar el acceso propio.",
  );

  if (failure) {
    return failure;
  }

  revalidatePath("/my-dependents");

  return { success: true };
}
