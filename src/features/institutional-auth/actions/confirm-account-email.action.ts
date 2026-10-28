"use server";

import { z } from "zod";

import { publicApiFetch } from "@common/services/public-api-fetch.service";
import { getResponseErrorActionState } from "@common/utils/action-state.util";

export async function confirmAccountEmail(
  _state: { error?: string; success?: boolean },
  form: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const token = z.string().min(1).max(256).safeParse(form.get("token"));

  if (!token.success) {
    return { error: "El enlace no es válido. Solicitá otro cambio de correo." };
  }

  const failure = await getResponseErrorActionState(
    publicApiFetch("/api/v1/auth/email-changes/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.data }),
    }),
    [],
    "No se pudo confirmar el correo. El enlace puede haber vencido o el iniciador ya no tiene autorización.",
  );

  return failure ?? { success: true };
}
