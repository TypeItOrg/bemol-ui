"use server";

import { z } from "zod";

import { publicApiFetch } from "@common/services/public-api-fetch.service";
import { getResponseErrorActionState } from "@common/utils/action-state.util";

export async function activateOwnAccess(
  _state: { error?: string; success?: boolean },
  form: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = z
    .object({ token: z.string().min(1).max(128), password: z.string().min(8).max(255), confirmPassword: z.string() })
    .refine((value) => value.password === value.confirmPassword)
    .safeParse(Object.fromEntries(form));

  if (!parsed.success) {
    return { error: "Revisá la invitación y usá contraseñas coincidentes de al menos 8 caracteres." };
  }

  const failure = await getResponseErrorActionState(
    publicApiFetch("/api/v1/auth/own-access/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    }),
    [],
    "No se pudo activar tu cuenta. Solicitá una nueva invitación.",
  );

  return failure ?? { success: true };
}
