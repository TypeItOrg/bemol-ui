"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { getResponseErrorActionState } from "@common/utils/action-state.util";

import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import { hasAllInstitutionalPermissions } from "@features/institutional-auth/utils/institutional-permission.util";

export async function managePersonAccessInvitation(
  institutionId: string,
  personId: string,
  _state: { error?: string; success?: boolean },
  form: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = z
    .object({
      institutionId: z.string().uuid(),
      personId: z.string().uuid(),
      operation: z.enum(["send", "cancel"]),
    })
    .safeParse({ institutionId, personId, operation: form.get("operation") });

  if (!parsed.success) {
    return { error: "La solicitud de invitación no es válida." };
  }

  const email = parsed.data.operation === "send" ? z.string().email().max(150).safeParse(form.get("email")) : undefined;

  if (email && !email.success) {
    return { error: "Ingresá un correo válido de la persona." };
  }

  const user = await requireInstitutionalUser();

  if (
    user.institutionId !== institutionId ||
    !hasAllInstitutionalPermissions(user, [
      INSTITUTIONAL_PERMISSION.PERSON_CREATE,
      INSTITUTIONAL_PERMISSION.USER_STATUS_UPDATE,
      INSTITUTIONAL_PERMISSION.ROLE_ASSIGN,
    ])
  ) {
    return { error: "No tenés permisos para dar acceso inicial en esta institución." };
  }

  const failure = await getResponseErrorActionState(
    institutionalApiFetch(`/api/v1/institutions/${institutionId}/people/${personId}/access-invitations`, {
      method: parsed.data.operation === "send" ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: email?.success ? JSON.stringify({ email: email.data }) : undefined,
    }),
    [],
    "No se pudo gestionar la invitación de acceso inicial.",
  );

  if (failure) {
    return failure;
  }

  revalidatePath("/people");
  revalidatePath(`/people/${personId}`);
  revalidatePath("/my-dependents");

  return { success: true };
}
